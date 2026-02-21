const { jsdecode_api } = require('../utils/encryptionHelper');
const Company = require('../models/mongodb/company.model');
const CompanyUser = require('../models/mongodb/company_user.model');
const TokenModel = require('../models/mongodb/token.model');

const verifyEncryptedToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        // console.log('Authorization Header:', authHeader);

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token missing' });
        }

        const token = authHeader.split(' ')[1];
        // console.log('Token:', token);

        const decrypted = jsdecode_api(token);
        // console.log('Decrypted Token:', decrypted);

        if (!decrypted) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        const parts = decrypted.split('#');
        const companyId = parts[1];
        // console.log('Decrypted Company ID:', companyId);

        const role = parts[2];
        // console.log('Decrypted Role:', role);

        if (!companyId || !role) {
            return res.status(400).json({ message: 'Invalid token format' });
        }

        if (role === 'Administrator' || role === 'Company') {
            const companyRecord = await Company.findOne({ companyId });
            // console.log('Company Record:', companyRecord);

            if (!companyRecord) {
                return res.status(401).json({ message: 'Invalid token' });
            }
            const tokenExists = await TokenModel.findOne({ companyId: companyRecord?.companyId, token });
            if (!tokenExists) {
                return res.status(401).json({ message: 'User logged out. Please login again.' });
            }


            req.body.companyId = companyRecord?.companyId;
        } else {
            const userRecord = await CompanyUser.findOne({ user_id: companyId });
            // console.log('User Record:', userRecord);

            if (!userRecord) {
                return res.status(401).json({ message: 'Invalid token' });
            }

            const tokenExists = await TokenModel.findOne({ user_id: userRecord.user_id, token });
            if (!tokenExists) {
                return res.status(401).json({ message: 'User logged out. Please login again.' });
            }

            req.body.user_id = userRecord?.user_id;
        }


        next();
    } catch (err) {
        console.error('Token verification error:', err.message);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = verifyEncryptedToken;
