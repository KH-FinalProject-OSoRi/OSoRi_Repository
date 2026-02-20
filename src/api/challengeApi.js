import { apiFetch } from "./http";
import api from "./axios";

export const challengeApi = {

  // 챌린지 목록
  list: ({ challengeMode } = {}) => {
    const qs = new URLSearchParams();
    if (challengeMode) qs.set("challengeMode", challengeMode);
    const query = qs.toString();
    return apiFetch(`/challenges${query ? `?${query}` : ""}`);
  },

  // 내 참여 목록
  myJoinedList: ({ userId, challengeMode } = {}) => {
    const qs = new URLSearchParams();
    if (userId != null) qs.set("userId", userId);
    if (challengeMode) qs.set("challengeMode", challengeMode);
    const query = qs.toString();
    return apiFetch(`/challenges/mychallenges${query ? `?${query}` : ""}`);
  },

  // 지난 챌린지 목록
  myPastJoinedList: ({ userId, challengeMode } = {}) => {
    const qs = new URLSearchParams();
    if (userId != null) qs.set("userId", userId);
    if (challengeMode) qs.set("challengeMode", challengeMode);
    const query = qs.toString();
    return apiFetch(`/challenges/mychallenges/past${query ? `?${query}` : ""}`);
  },

  // 참여하기
  join: (payload) =>
    apiFetch(`/challenges/mychallenges`, {
      method: "POST",
      body: payload,
    }),

  // 그룹챌린지
  getMyJoinedList: ({ userId, challengeMode } = {}) => {
    const qs = new URLSearchParams();
    if (userId != null) qs.set("userId", userId);
    if (challengeMode) qs.set("challengeMode", challengeMode);
    const query = qs.toString();
    return apiFetch(`/challenges/mychallenges${query ? `?${query}` : ""}`);
  },

  // 2️⃣ ✅ 그룹 챌린지 전용 참여 (POST /challenges/group)
  joinGroupChallenge: async (groupChallData) => {
    // 컨트롤러의 @PostMapping("/group") 호출
    const response = await api.post('/challenges/group', groupChallData);
    return response.data;
  },

  // 3️⃣ ✅ 그룹 챌린지 전용 참여 목록 (GET /challenges/myJoinedList)
  getGroupJoinedList: async (groupbId, userId) => {
    // 컨트롤러의 @GetMapping("/myJoinedList") 호출
    const response = await api.get('/challenges/groupJoinedList', {
      params: { groupbId, userId }
    });
    return response.data;
  },

  getGroupPastChallengeList: async (groupbId, userId) => {
    // 백엔드 컨트롤러에 정의한 매핑 주소와 일치해야 합니다.
    const response = await api.get(`/challenges/group/past`, {
      params: { groupbId, userId }
    });
    return response.data;
  },

  getGroupRanking: async (groupbId, challengeId) => {
    const response = await api.get('/challenges/group/ranking', {
      params: { groupbId, challengeId }
    });
    return response.data;
  },

  // [ADDED] 특정 챌린지의 실시간 진행 수치(금액/횟수/일자별) 호출
  getChallengeProgress: async (userId, challengeId) => {
    const response = await api.get('/challenges/mychallenges/progress', {
      params: { userId, challengeId }
    });
    return response.data;
  },

  createChallenge: async (formData) => {
    return await api.post('/challenges', formData);
  },

};