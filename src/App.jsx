import React, { useState } from "react";
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
import ExpensePage from './features/auth/pages/ExpensePage';

function App() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  return (
    <Router>
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
        </Route>

        {/* 로그인 필요 */}
        <Route
          path="/mypage"
          element={
            <PrivateRoute>
              <MyPageLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<MyPage />} />
          <Route path="assets" element={<MyPage />} />

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
          <Route path='expenseForm' element={<ExpensePage/>}/>
          <Route path='group/:groupId/expenseForm' element={<ExpensePage/>}/>

        </Route>
      </Routes>
    </Router>
  );
}

export default App;


// import React, { useState } from "react";
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import MainPage from "./components/common/MainPage";
// import MyPageLayout from "./features/auth/pages/MyPageLayout";
// import MyPage from "./features/auth/pages/MyPage";
// import CalendarView from "./features/menu/CalendarView";
// import MyBadges from "./features/auth/pages/MyBadges";
// import ProfileSettings from "./features/auth/pages/ProfileSettings";
// import AuthLayout from "./layouts/AuthLayout";
// import LoginPage from "./features/auth/pages/LoginPage";
// import RegisterPage from "./features/auth/pages/RegisterPage";
// import PrivateRoute from "./routes/PrivateRoute";
// import { transactions } from './Data/mockData'; //목업 수입지출데이터
// import ExpenseForm from './features/auth/pages/ExpenseForm';


// function App() {
//   const [currentDate, setCurrentDate] = useState(new Date());
//   return (
//     <Router>
//       <Routes>
//         <Route path="/" element={<MainPage />} />

//         {/* 로그인/회원가입 화면 (헤더/푸터 없이) */}
//         <Route element={<AuthLayout />}>
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/register" element={<RegisterPage />} />
//         </Route>

//         {/* 로그인 필요 */}
//         <Route
//           path="/mypage"
//           element={
//             <PrivateRoute>
//               <MyPageLayout />
//             </PrivateRoute>
//           }
//         >
//           <Route index element={<MyPage />} />
//           <Route path="assets" element={<MyPage />} />
//           <Route path="calendarView" element={<CalendarView
//                                                 transactions={transactions}
//                                                 currentDate={currentDate}
//                                                 setCurrentDate={setCurrentDate}
//                                               />} />
//           <Route path="myBadges" element={<MyBadges />} />
//           <Route path="profileSettings" element={<ProfileSettings />}/>
//           <Route path='expenseForm' element={<ExpenseForm/>}/>
//         </Route>
//       </Routes>
//     </Router>
//   );
// }

// export default App;
