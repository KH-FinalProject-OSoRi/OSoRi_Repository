import api from "./axios";

export const badgeApi = {
    getUserBadges: async (userId) => {
        const response = await api.get(`/api/badges/${userId}`, {
            withCredentials: true
        });
        return response.data;
    },

    saveUserBadge: async (badgeData) => {
        const response = await api.post('/api/badges/save', badgeData);
        return response.data;
    }
};