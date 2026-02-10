import { Link } from "react-router-dom";

export default function NotFound(){
    return(
        <div className="container">
            {/* 로고 영역 (이미지의 OSORI 로고 느낌) */}
            <div className="header">
                <span className="logo">OSORI</span>
            </div>
            <div className="iconContainer">
                <div className="iconBox">
                    <span className={{ fontSize: '70px' }}>⚠️</span>
                </div>
            </div>

            <h1 className='title'>
            길을 잃으셨나요? <br />
            <span className="highlight">페이지를 찾을 수 없습니다.</span>
            </h1>
            <Link to="/mypage" className="button"> 
                마이페이지로 돌아가기
            </Link>
        </div>
    );
}