import api from "./axios";

export const badgeApi = {
    // 유저의 뱃지 목록 조회
    getUserBadges: async (userId) => {
        const response = await api.get(`/api/badges/${userId}`);
        return response.data;
    },

    saveUserBadge: async (badgeData) => {
        // badgeData 예시: { userId: 1, badgeId: 2 }
        const response = await api.post('/api/badges/save', badgeData);
        return response.data;
    }
};