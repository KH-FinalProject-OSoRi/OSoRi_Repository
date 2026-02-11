import React, { useState,useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainPage from "./components/common/MainPage";
import MyPageLayout from "./features/auth/pages/MyPageLayout";
import MyPage from "./features/auth/pages/MyPage";
import CalendarView from "./features/menu/CalendarView";
import MyBadges from "./features/auth/pages/MyBadges";
import ProfileSettings from "./features/auth/pages/ProfileSettings";
import AuthLayout from "./layouts/AuthLayout";
import FindIdPage from "./features/auth/pages/FindIdPage";
import FindPasswordPage from "./features/auth/pages/FindPasswordPage";
import PrivateRoute from "./routes/PrivateRoute";
import { transactions } from './Data/mockData'; //목업 수입지출데이터
import RegisterPage from './features/auth/pages/RegisterPage';
import LoginPage from './features/auth/pages/LoginPage';
import ExpenseForm from './features/auth/pages/ExpenseForm';
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import MyAccountBook from "./features/auth/pages/MyAccountBook";
import useAlarmSocket from './features/alarm/useAlarmSocket';
import ExpensePage from './features/auth/pages/ExpensePage';
import FixedTransPage from "./features/auth/pages/FixedTransPage"; // 추가
import GroupAccountBook from './features/group/GroupAccountBook';
import ChallengePage from "./features/auth/pages/ChallengePage";
import KakaoCallback from "./features/auth/pages/KakaoCallback";
import SocialRegisterPage from "./features/auth/pages/SocialRegisterPage";
import { groupBudgetApi } from "./api/groupBudgetApi";
import GroupBookGuard from "./features/group/GroupBookGuard";
import ChallengeRequest from "./features/auth/pages/ChallengeRequest";

const SocketHandler = ({ userId,setNotifications,refreshGroupList }) => {
  const { notifications } = useAlarmSocket(userId,refreshGroupList); // 여기서 호출하면 에러 안 남
  
  useEffect(() => {
    setNotifications(notifications);
  }, [notifications, setNotifications]);

  return null;
};

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const storedData = JSON.parse(localStorage.getItem("user"));
  const currentId = storedData ? storedData.loginId : null;
  const [notifications, setNotifications] = useState([]); 
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [groupBudgetList, setGroupBudgetList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroupBudgetAll = async() => {
    try {
      setIsLoading(true); 

      const response = await groupBudgetApi.fetchGroupBudgetAll();
      setGroupBudgetList(response);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(()=>{
    fetchGroupBudgetAll();
  },[]);

  return (
    <Router>
      <SocketHandler userId={currentId} 
                     setNotifications={setNotifications}
                     refreshGroupList={fetchGroupBudgetAll} />
      <Routes>
        <Route path="/" element={<MainPage />} />

        {/* [BEFORE] 로그인/회원가입만 매핑 */}
        {/*
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                </Route>
        */}

        {/* [CHANGED] /reset-password 라우트 추가 */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/find-id" element={<FindIdPage />} />
          <Route path="/find-password" element={<FindPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />
          <Route path="/social-register" element={<SocialRegisterPage />} />
        </Route>

        {/* 로그인 필요 */}
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <MyPageLayout notifications={notifications} refreshGroupList={fetchGroupBudgetAll}/>
            </PrivateRoute>
          }
        >
          <Route index element={<MyPage refreshGroupList={fetchGroupBudgetAll}/>} />
          <Route path="assets" element={<MyPage refreshGroupList={fetchGroupBudgetAll}/>} />

          <Route
            path="calendarView"
            element={
              <CalendarView
                transactions={transactions}
                currentDate={calendarDate}
                setCurrentDate={setCalendarDate}
              />
            }
          />


          <Route path="myBadges" element={<MyBadges />} />
          <Route path="profileSettings" element={<ProfileSettings />}/>
          <Route path="myAccountBook" element={<MyAccountBook />} />
          <Route path='groupAccountBook' 
                 element={
                    <GroupBookGuard groupList={groupBudgetList} isLoading={isLoading}> 
                      <GroupAccountBook/>
                    </GroupBookGuard>
          }/>
          <Route path='expenseForm' element={<ExpensePage/>}/>
          <Route path='group/:groupId/expenseForm' element={<ExpensePage/>}/>
          <Route path="fixedTrans" element={<FixedTransPage />} />
          <Route path="challenge" element={<ChallengePage />} />
          <Route path="challengeRequest" element={<ChallengeRequest />} />  
        </Route>
      </Routes>
    </Router>
  );
}

export default App;