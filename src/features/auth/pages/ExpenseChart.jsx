// src/Pages/Charts/ExpenseChart.jsx
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function ExpenseChart({ transactions = [], currentDate }) {
  if (!currentDate || !(currentDate instanceof Date)) return null;
  const targetYear = currentDate.getFullYear();
  const targetMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
  const targetYM = `${targetYear}-${targetMonth}`;

  const expenses = transactions.filter(t => 
    t.type?.toUpperCase() === 'OUT' && 
    t.date.startsWith(targetYM)
  );

  // --- [로직] 사용자의 6가지 카테고리 분류 규칙 ---
  const categorizeExpense = (item) => {
    const title = item.text || "";
    const memo = item.memo || "";
    const cat = item.category || "";
    const fullText = `${title} ${memo} ${cat}`;

    if (/(스타벅스|투썸|이디야|메가커피|공차|설빙|베스킨|식당|한식|중식|일식|레스토랑|빕스|아웃백|맥도날드|버거킹|롯데리아|맘스터치|써브웨이|파리바게뜨|뚜레쥬르|던킨|호프|이자카야|포차|치킨|피자|족발|배달|식비)/.test(fullText)) return '식비';
    if (/(마트|홈플러스|코스트코|트레이더스|슈퍼|편의점|GS25|CU|세븐일레븐|다이소|무인양품|자주|미용|헤어|네일|세탁|수선|생활|주거|월세|통신비|요금|전기|수도)/.test(fullText)) return '생활/마트';
    if (/(백화점|몰|스타필드|아울렛|화장품|올리브영|시코르|러쉬|이니스프리|의류|패션|옷|유니클로|자라|무신사|나이키|아디다스|안경|잡화|가방|신발|도서|서점|교보문고|알라딘|문구)/.test(fullText)) return '쇼핑';
    if (/(병원|내과|치과|안과|피부과|한의원|약국|운동|헬스|요가|필라테스|수영|건강)/.test(fullText)) return '의료/건강';
    if (/(주유|충전|교통|택시|버스|지하철|기차|KTX|세차|정비|주차|하이패스)/.test(fullText)) return '교통/차량';
    if (/(영화|공연|CGV|롯데시네마|메가박스|노래방|PC방|볼링|당구|방탈출|게임|여행|숙박|호텔|모텔|펜션|야놀자|문화)/.test(fullText)) return '문화/여가';

    return '기타';
  };

  const totalExpenditure = expenses.reduce((sum, curr) => sum + Math.abs(curr.amount), 0);

  const analysisData = expenses.reduce((acc, curr) => {
    const newCategory = categorizeExpense(curr);
    acc[newCategory] = (acc[newCategory] || 0) + Math.abs(curr.amount);
    return acc;
  }, {});

  const labels = Object.keys(analysisData);
  const dataValues = Object.values(analysisData);

  const data = {
    labels: labels,
    datasets: [
      {
        data: dataValues,
        backgroundColor: [
          '#FF6384', '#4BC0C0', '#FFCE56', '#36A2EB', '#9966FF', '#FF9F40', '#C9CBCF'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // 크기 유연성을 위해 false 설정
    plugins: {
      legend: {
        position: 'right', // 오른쪽에 배치
        align: 'center',   // 세로 중앙 정렬
        labels: {
          usePointStyle: true, // 범례 아이콘을 원형으로 변경
          pointStyle: 'circle',
          padding: 20,         // 항목 간 간격
          font: {
            size: 12,
            weight: 'bold'
          },
          // 범례 텍스트에 금액이나 퍼센트를 추가하고 싶다면 generateLabels 등을 사용할 수 있습니다.
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw.toLocaleString()}원`
        }
      }
    },
    layout: {
      padding: {
        left: 10,
        right: 10
      }
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="chart-card">
        <h3>📊 카테고리 별 소비 분석</h3>
        <p style={{ padding: '50px 0', color: '#888', textAlign: 'center' }}>분석할 지출 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="chart-card">
      <h3>📊 카테고리 별 소비 분석</h3>
      <div className='chart-main-container'>
        <Doughnut data={data} options={options}/>
      </div>
      
      <div className="chart-summary">
          총 지출: <strong> {totalExpenditure.toLocaleString()}원 </strong>
      </div>
    </div>
  );
}

export default ExpenseChart;