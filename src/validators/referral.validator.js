export const validateReferralSettings = ({ referrerValue, refereeValue }) => {

    if (!referrerValue || !refereeValue) {
        return 'Both referrer and referee values are required';
    }

    const referrer = Number(referrerValue);
    const referee = Number(refereeValue);

    if (isNaN(referrer) || isNaN(referee)) {
        return 'Referral values must be numbers';
    }

    if (referrer < 0 || referee < 0) {
        return 'Referral values cannot be negative';
    }

    if (referrer <= referee) {
        return 'Referrer value cannot be greater than referee value';
    }

    if (referrer > 100 || referee > 100) {
        return 'Referral values cannot be greater than 100';
    }

    return null;
};
