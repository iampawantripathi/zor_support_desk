const dayjs = require('dayjs');
const ResponseService = require('../services/service');
const AppError = require('../utils/AppError');

const Company = require('../models/mongodb/company.model');
const CompanyUser = require('../models/mongodb/company_user.model');
const Ticket = require('../models/mongodb/ticket.model');
const TicketReply = require('../models/mongodb/ticketReply.model');
const TicketDocument = require('../models/mongodb/ticketDocumnet.model');
const TokenModel = require('../models/mongodb/token.model');

class ticketController {


    // Create Company
    async createCompany(req, res, next) {
        console.log("Creating company...", req.body);

        try {
            const {
                companyId,
                company_name,
                company_details,
                user_details,
                role,
                token
            } = req.body;

            // ✅ Required field validation
            if (!companyId || !company_name || !company_details || !role) {
                throw new AppError("companyId, company_name, company_details, and role are required", 400);
            }

            // ✅ Company upsert (create or update)
            const companyFilter = { companyId, role };
            const companyUpdate = {
                companyId,
                company_name,
                company_details,
                role
            };

            const company = await Company.findOneAndUpdate(
                companyFilter,
                companyUpdate,
                { new: true, upsert: true, setDefaultsOnInsert: true }
            );

            let companyUserData = null;

            // ✅ Strictly validate user_details before storing
            const isValidUserDetails =
                user_details &&
                typeof user_details === 'object' &&
                user_details.user_id &&
                user_details.user_name &&
                user_details.role;

            if (isValidUserDetails) {
                const userFilter = {
                    companyId,
                    user_id: user_details.user_id
                };

                const userUpdate = {
                    companyId,
                    cID: company._id,
                    user_id: user_details.user_id,
                    user_name: user_details.user_name,
                    user_details: user_details
                };

                companyUserData = await CompanyUser.findOneAndUpdate(
                    userFilter,
                    userUpdate,
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
            }

            // ✅ Save token if provided
            if (token) {

                const tokenFilter = {
                    companyId,
                    user_id: user_details ? user_details.user_id : null,
                };

                const tokenUpdate = {
                    companyId,
                    user_id: user_details ? user_details.user_id : null,
                    token
                };

                await TokenModel.findOneAndUpdate(
                    tokenFilter,
                    tokenUpdate,
                    { new: true, upsert: true, setDefaultsOnInsert: true }
                );
            }

            return ResponseService.success(res, {
                message: "Company and user upserted successfully",
                company,
                ...(companyUserData ? { user: companyUserData } : {})
            }, 200);

        } catch (error) {
            next(error);
        }
    }

    // Fetch Company
    async fetchCompany(req, res, next) {
        try {
            const { companyId } = req.query;

            if (!companyId) {
                return res.status(400).json({ message: 'companyId is required' });
            }

            // Fetch the company using the provided companyId to check role
            const requestingCompany = await Company.findOne({ companyId });

            if (!requestingCompany) {
                return res.status(404).json({ message: 'Company not found' });
            }

            // If the role is 'Administrator', return all companies
            if (requestingCompany.role === 'Administrator') {
                const companies = await Company.find(
                    {},
                    { companyId: 1, company_name: 1, _id: 0 }
                );
                return res.status(200).json(companies);
            }

            // Otherwise, return only the requesting company
            return res.status(200).json([{
                companyId: requestingCompany.companyId,
                company_name: requestingCompany.company_name
            }]);

        } catch (error) {
            console.error('Error fetching companies:', error);
            next(error);
        }
    }

    // Fetch Company or User by ID
    async fetchCompanyOrUser(req, res, next) {
        try {
            const { companyId, user_id } = req.body;

            // 👉 If only companyId is passed — fetch company
            if (companyId && !user_id) {
                const company = await Company.findOne({ companyId });

                if (!company) {
                    return res.status(404).json({ message: 'Company not found' });
                }

                const companyData = {
                    id: company.companyId,
                    companyId: company.companyId,
                    name: company.company_name,
                    role: company.role,
                }

                return res.status(200).json({ type: 'company', data: companyData });
            }

            // 👉 If only user_id is passed — fetch company_user
            if (user_id && !companyId) {
                const user = await CompanyUser.findOne({ user_id });

                if (!user) {
                    return res.status(404).json({ message: 'Company user not found' });
                }

                const userData = {
                    id: user.user_id,
                    companyId: user.companyId,
                    name: user.user_name,
                    role: user.user_details.role,
                }
                return res.status(200).json({ type: 'company_user', data: userData });
            }

            // 🛑 If neither or both are passed
            return res.status(400).json({ message: 'Pass either companyId or user_id (not both)' });

        } catch (error) {
            console.error('Error in fetchCompanyOrUser:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    // Create Ticket
    async createTicket(req, res, next) {
        try {
            const {
                title,
                description,
                priority,
                created_by,
                status,
                companyId,
                user_id
            } = req.body;

            // Step 1: Lookup company by numeric companyId
            const company = await Company.find({ companyId: companyId });
            if (!company || company.length === 0) {
                throw new AppError('Company not found', 404);
            }
            // Step 2: Generate ticket ID (random 6-digit)
            const ticketId = Math.floor(100000 + Math.random() * 900000);

            // Step 3: Prepare ticket payload
            const ticketData = {
                companyId: company[0]._id,            // MongoDB ObjectId
                company_uid: company[0].companyId,
                user_id,  // original numeric ID
                ticketId,
                title,
                description,
                priority,
                created_by,
                status,
                document: req.file ? 1 : 0,
                ticket_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };

            // Step 4: Create Ticket
            const ticket = await Ticket.create(ticketData);

            // Step 5: If file uploaded, create document entry
            if (req.file) {
                const fileUrl = `/uploads/tickets/${req.file.filename}`;

                await TicketDocument.create({
                    companyId: company[0]._id,
                    ticketId: ticket._id,
                    user_id,
                    ticket_reply_Id: null,
                    doc_path: fileUrl, // ✅ Store full URL
                    created_by,
                    ticket_reply_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
                });
            }

            return ResponseService.success(res, {
                message: 'Ticket created successfully',
                data: ticket
            }, 201);

        } catch (error) {
            next(error);
        }
    }

    // Get Tickets with pagination and search
    async getTickets(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status, companyId } = req.query;
            const skip = (parseInt(page) - 1) * parseInt(limit);

            // Date formatting helper
            const formatDate = (date) => {
                if (!date) return null;
                const d = new Date(date);
                const pad = (n) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };

            // Build filter
            const filter = {
                $and: [
                    {
                        $or: [
                            { title: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } }
                        ]
                    }
                ]
            };

            let isAdmin = false;

            if (companyId) {
                const company = await Company.findOne({ companyId });
                if (company?.role === 'Administrator') {
                    isAdmin = true;
                }
            }

            if (!isAdmin && companyId) {
                filter.$and.push({ company_uid: companyId });
            }

            if (status) {
                filter.$and.push({ status });
            }

            const statsMatch = !isAdmin && companyId ? { company_uid: companyId } : {};

            const total = await Ticket.countDocuments(filter);

            const allTickets = await Ticket.find(filter)
                .populate('company_uid', 'company_name company_details companyId');

            // Append replyCount and lastReplyDate (raw & formatted) to each ticket
            const enrichedTickets = await Promise.all(
                allTickets.map(async (ticket) => {
                    const replyCount = await TicketReply.countDocuments({ ticketId: ticket._id });

                    const lastReply = await TicketReply.findOne({ ticketId: ticket._id })
                        .sort({ updatedAt: -1 })
                        .select('updatedAt').populate({
                            path: 'companyId',
                            select: 'companyId company_name'
                        });;
                    console.log("lastReply", lastReply);

                    const lastReplyDateRaw = lastReply?.updatedAt || ticket.updatedAt;

                    let unreadCount;
                    if (companyId !== lastReply?.companyId?.companyId) {

                        // Get unread replies count
                        unreadCount = await TicketReply.countDocuments({
                            ticketId: ticket._id,
                            isRead: false
                        });
                    }

                    return {
                        ...ticket.toObject(),
                        replyCount,
                        unreadCount, // ⬅️ Include it in the response
                        lastReplyDate: formatDate(lastReply?.updatedAt || null),
                        _sortDate: lastReplyDateRaw
                    };
                })
            );


            // Sort by _sortDate (descending)
            enrichedTickets.sort((a, b) => new Date(b._sortDate) - new Date(a._sortDate));

            // Apply pagination after sorting
            const paginatedTickets = enrichedTickets.slice(skip, skip + parseInt(limit));

            const totalTickets = await Ticket.countDocuments(statsMatch);

            const statusCounts = await Ticket.aggregate([
                { $match: statsMatch },
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const statusSummary = {
                Open: 0,
                'In Progress': 0,
                Resolved: 0,
                Closed: 0
            };

            statusCounts.forEach(stat => {
                statusSummary[stat._id] = stat.count;
            });

            return ResponseService.success(res, {
                message: 'Tickets fetched successfully',
                data: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    results: paginatedTickets,
                    stats: {
                        totalTickets,
                        ...statusSummary
                    }
                }
            }, 200);

        } catch (error) {
            next(error);
        }
    }

    // Create Ticket Reply
    async createTicketReply(req, res, next) {
        try {
            const {
                ticketId,
                reply_msg,
                created_by,
                companyId,
                user_id
            } = req.body;

            // Check if ticket exists
            const ticketExists = await Ticket.findById(ticketId);
            if (!ticketExists) {
                throw new AppError('Ticket not found', 404);
            }

            // Get company details
            const company = await Company.find({ companyId: companyId });
            if (!company || company.length === 0) {
                throw new AppError('Company not found', 404);
            }

            // Create ticket reply
            const replyData = {
                companyId: company[0]._id,
                ticketId,
                user_id,
                reply_msg,
                created_by,
                isRead: false, // Default to unread
                ticket_reply_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
            };

            const ticketReply = await TicketReply.create(replyData);

            // If file is uploaded, store it in ticket_document
            if (req.file) {
                const fileUrl = `/uploads/tickets/${req.file.filename}`;
                console.log("File uploaded:", fileUrl);

                await TicketDocument.create({
                    companyId: company[0]._id,
                    ticketId,
                    ticket_reply_Id: ticketReply._id,
                    doc_path: fileUrl,
                    created_by,
                    ticket_reply_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
                });
            }

            return ResponseService.success(res, {
                message: 'Reply added to ticket successfully',
                data: ticketReply
            }, 201);

        } catch (error) {
            next(error);
        }
    }

    // Update Ticket Status
    async updateTicketStatus(req, res, next) {
        try {
            const { id } = req.params; // This is MongoDB _id like '686b7cde439b8534633e3066'
            const { status } = req.body;

            const allowedStatuses = ['Open', 'In Progress', 'Resolved', 'Closed'];
            if (!allowedStatuses.includes(status)) {
                throw new AppError('Invalid status. Allowed values: Open, In Progress, Resolved, Closed', 400);
            }

            const updatedTicket = await Ticket.findOneAndUpdate(
                { _id: id }, // ✅ No parseInt here
                { status },
                { new: true }
            );

            if (!updatedTicket) {
                throw new AppError('Ticket not found', 404);
            }

            return ResponseService.success(res, {
                message: 'Ticket status updated successfully',
                data: updatedTicket
            });
        } catch (error) {
            next(error);
        }
    }

    // Get Ticket Replies by Ticket ID
    async getTicketRepliesByTicketId(req, res, next) {
        try {
            const { ticketId, companyId } = req.params;
            console.log("ticketId",ticketId); 

            // Date formatting helper
            const formatDate = (date) => {
                if (!date) return null;
                const d = new Date(date);
                const pad = (n) => n.toString().padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };

            // Validate ticket
            const ticket = await Ticket.findById(ticketId);
            if (!ticket) {
                return res.status(404).json({ message: 'Ticket not found' });
            }

            // Get ticket-level documents (not associated with replies)
            const ticketDocuments = await TicketDocument.find({ ticketId, ticket_reply_Id: null });

            // Get all replies for this ticket
            const replies = await TicketReply.find({ ticketId })
                .populate({
                    path: 'companyId',
                    select: 'companyId company_name'
                });
            if (replies && replies.length > 0) {
                console.log("ticket.company_uid", companyId);
                console.log("replies1111", replies[0].companyId.companyId);

                // if (ticket.company_uid !== replies[0].companyId.companyId) {
                if ((replies[0].companyId.companyId !== companyId) && (ticket.company_uid !== companyId)) {

                    await TicketReply.updateMany(
                        { ticketId, isRead: false },
                        { $set: { isRead: true } }
                    );
                }
            }




            // Track latest updatedAt date for replies
            let latestReplyDate = null;

            // Attach documents + compute latest updatedAt
            const repliesWithDocs = await Promise.all(
                replies.map(async (reply) => {
                    const replyDocs = await TicketDocument.find({
                        ticket_reply_Id: reply._id
                    });

                    const replyObj = reply.toObject();
                    replyObj.documents = replyDocs;

                    // Track latest updatedAt
                    if (!latestReplyDate || reply.updatedAt > latestReplyDate) {
                        latestReplyDate = reply.updatedAt;
                    }

                    return replyObj;
                })
            );

            // Add lastUpdated to ticket object (formatted)
            const ticketObj = ticket.toObject();
            ticketObj.createdAt = formatDate(ticket.createdAt);
            ticketObj.lastUpdated = formatDate(latestReplyDate);

            return res.status(200).json({
                message: 'Ticket and replies fetched successfully',
                data: {
                    ticket: ticketObj,
                    ticketDocuments,
                    replies: repliesWithDocs
                }
            });
        } catch (error) {
            next(error);
        }
    }

    // Update Ticket and optionally add a new document
    async updateTicket(req, res, next) {
        try {
            const { id } = req.params;
            const {
                title,
                description,
                priority,
                status,
                updated_by // optional: who updated it
            } = req.body;

            const updateFields = {
                ...(title && { title }),
                ...(description && { description }),
                ...(priority && { priority }),
                ...(status && { status }),
            };

            if (req.file) {
                updateFields.document = 1;

                // Save new document in ticket_document
                await TicketDocument.create({
                    companyId: req.body.companyId,
                    ticketId: id,
                    ticket_reply_Id: null,
                    doc_path: req.file.path,
                    created_by: updated_by || 'system',
                    ticket_reply_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
                });
            }

            const updatedTicket = await Ticket.findByIdAndUpdate(id, updateFields, { new: true });

            if (!updatedTicket) {
                throw new AppError('Ticket not found', 404);
            }

            return ResponseService.success(res, {
                message: 'Ticket updated successfully',
                data: updatedTicket
            });

        } catch (error) {
            next(error);
        }
    }

    // Update Ticket Reply
    async updateTicketReply(req, res, next) {
        try {
            const { id } = req.params;
            const { reply_msg, updated_by } = req.body;

            if (!reply_msg) {
                throw new AppError('Reply message is required', 400);
            }

            const updatedReply = await TicketReply.findByIdAndUpdate(
                id,
                {
                    reply_msg,
                    ticket_reply_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
                },
                { new: true }
            );

            if (!updatedReply) {
                throw new AppError('Ticket reply not found', 404);
            }

            if (req.file) {
                await TicketDocument.create({
                    companyId: updatedReply.companyId,
                    ticketId: updatedReply.ticketId,
                    ticket_reply_Id: updatedReply._id,
                    doc_path: req.file.path,
                    created_by: updated_by || 'system',
                    ticket_reply_dateTime: dayjs().format('YYYY-MM-DD HH:mm:ss')
                });
            }

            return ResponseService.success(res, {
                message: 'Ticket reply updated successfully',
                data: updatedReply
            });

        } catch (error) {
            next(error);
        }
    }


    async deleteToken(req, res, next) {
        try {
            const { companyId, user_id } = req.body;

            // ✅ companyId is required
            if (!companyId) {
                return res.status(400).json({
                    success: false,
                    message: "companyId is required"
                });
            }

            // ✅ Build dynamic filter
            const filter = { companyId };
            if (user_id) {
                filter.user_id = user_id;
            }

            const deleted = await TokenModel.findOneAndDelete(filter);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Token not found for the given parameters"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Token deleted successfully"
            });

        } catch (error) {
            next(error);
        }
    }




}

module.exports = new ticketController();
