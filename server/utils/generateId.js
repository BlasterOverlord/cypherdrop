// Helper to generate a short, URL-friendly ID
// For this we'll use a random 8-character string (Base36)
const generateId = () => {
    return Math.random().toString(36).substring(2, 10);
};

module.exports = generateId;