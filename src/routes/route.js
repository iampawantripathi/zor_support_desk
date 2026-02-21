const express = require('express');
const { celebrate, Joi, Segments } = require('celebrate');

const router = express.Router();

const ticketController = require('../controllers/ticketController');
const verifyEncryptedToken = require('../middlewares/verifyEncryptedToken');
const upload = require('../middlewares/upload');


// Create a new ticket
router.post(
    '/api/create-ticket',
    verifyEncryptedToken,
    upload.single('document'),
    celebrate({
        [Segments.BODY]: Joi.object({
            title: Joi.string().trim().min(1).required().messages({
                'string.empty': 'Title cannot be empty or just spaces',
                'string.min': 'Title must contain non-space characters'
            }),
            description: Joi.string().trim().min(1).required().messages({
                'string.empty': 'Description cannot be empty or just spaces',
                'string.min': 'Description must contain non-space characters'
            }),
            priority: Joi.string().valid('low', 'medium', 'high').required(),
            created_by: Joi.string().required(),
            status: Joi.string().optional(),
            companyId: Joi.string().required(),
            user_id: Joi.string().required()
        }),
    }),
    ticketController.createTicket
);

// Get all tickets
router.get(
    '/api/tickets',
    verifyEncryptedToken,
    celebrate({
        [Segments.QUERY]: Joi.object({
            page: Joi.number().optional(),
            limit: Joi.number().optional(),
            search: Joi.string().optional(),
            status: Joi.string().optional(),
            companyId: Joi.string().required(),
            user_id: Joi.string().optional()
        }),
    }),
    ticketController.getTickets
);

// Create a ticket reply
router.post(
    '/api/ticket/reply',
    verifyEncryptedToken,
    upload.single('document'),
    celebrate({
        [Segments.BODY]: Joi.object({
            ticketId: Joi.string().required(),
            reply_msg: Joi.string().required(),
            created_by: Joi.string().required(),
            companyId: Joi.string().required(),
            user_id: Joi.string().required()
        }),
    }),
    ticketController.createTicketReply
);

// Update ticket status
router.patch(
    '/api/tickets/:id',
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            status: Joi.string().valid('Open', 'In Progress', 'Resolved', 'Closed').required(),
        }),
    }),
    ticketController.updateTicketStatus
);

// Get replies for a specific ticket
router.get(
    '/api/tickets/:ticketId/:companyId/replies',
    verifyEncryptedToken,
    celebrate({
        [Segments.PARAMS]: Joi.object({
            ticketId: Joi.string().required(),
            companyId: Joi.string().required()
        }),
    }),
    ticketController.getTicketRepliesByTicketId
);

// Update a ticket
router.put(
    '/api/tickets/:id',
    upload.single('document'),
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            title: Joi.string().optional(),
            description: Joi.string().optional(),
            priority: Joi.string().valid('low', 'medium', 'high').optional(),
            status: Joi.string().valid('open', 'in-progress', 'closed').optional(),
        }),
    }),
    ticketController.updateTicket
);

// Update a ticket reply
router.put(
    '/api/ticket/reply/:id',
    upload.single('document'),
    celebrate({
        [Segments.PARAMS]: Joi.object({
            id: Joi.string().required(),
        }),
        [Segments.BODY]: Joi.object({
            message: Joi.string().required(),
        }),
    }),
    ticketController.updateTicketReply
);

// Create a new company
router.post(
    '/api/create-company',
    celebrate({
        [Segments.BODY]: Joi.object({
            companyId: Joi.string().required(),
            company_name: Joi.string().required(),
            company_details: Joi.object().required(),
            role: Joi.string().required(),
            token: Joi.string().required(),
            user_details: Joi.object({
                user_id: Joi.string().required(),
                user_name: Joi.string().required(),
                role: Joi.string().required(),
                email: Joi.string().email().required()
            }).optional()
        })
    }),
    ticketController.createCompany
);

// Fetch company details
router.get(
    '/api/get-company',
    verifyEncryptedToken,
    celebrate({
        [Segments.QUERY]: Joi.object({
            companyId: Joi.string().optional()
        }),
    }),
    ticketController.fetchCompany
);

// Fetch company details or user details
router.get(
    '/api/details',
    verifyEncryptedToken,
    celebrate({
        [Segments.BODY]: Joi.object({
            companyId: Joi.string().optional(),
            user_id: Joi.string().optional()
        }),
    }),
    ticketController.fetchCompanyOrUser
);

router.delete(
    '/api/remove/token',
    celebrate({
        [Segments.BODY]: Joi.object({
            companyId: Joi.string().optional(),
            user_id: Joi.string().optional()
        }),
    }),
    ticketController.deleteToken
);

module.exports = router;