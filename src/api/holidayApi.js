import axios from 'axios';

// 공공데이터포털에서 발급받은 "Encoding" 인증키 사용 권장
const SERVICE_KEY = '13e6cd1d0b25da1156a89cbfeb3e2790e1542c562db6aa23a4760b6864fbfc22';

export const fetchHolidays = async (year, month) => {
    const cacheKey = `holidays-${year}-${month}`;
    const cachedData = localStorage.getItem(cacheKey);

    // 1. 캐시 확인: 이미 저장된 데이터가 있다면 즉시 반환 (매우 빠름)
    if (cachedData) {
        return JSON.parse(cachedData);
    }

    const solYear = year;
    const solMonth = String(month).padStart(2, '0');
    
    // 2. 403 에러 방지를 위해 URL에 직접 서비스키 포함
    const url = `https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo?serviceKey=${SERVICE_KEY}&solYear=${solYear}&solMonth=${solMonth}&_type=json`;

    try {
        const response = await axios.get(url);

        const items = response.data.response?.body?.items?.item;
        const holidayList = Array.isArray(items) ? items : items ? [items] : [];

        const result = holidayList.reduce((acc, holiday) => {
            const dateStr = String(holiday.locdate).replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
            acc[dateStr] = holiday.dateName;
            return acc;
        }, {});

        // 3. 성공적으로 가져온 데이터를 로컬 스토리지에 저장 (다음 로딩부터 빨라짐)
        if (Object.keys(result).length > 0) {
            localStorage.setItem(cacheKey, JSON.stringify(result));
        }

        return result;
    } catch (error) {
        console.error("공휴일 로드 실패:", error);
        return {};
    }
};