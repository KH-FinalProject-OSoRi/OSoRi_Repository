import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useNavigate } from "react-router-dom"; 

const useAlarmSocket = (userId,refreshGroupList) => {
    const [notifications, setNotifications] = useState([]);
    const navigate = useNavigate()
;
    useEffect(() => {
        if (!userId) return; //유저 정보 없으면 리턴

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/osori/ws"),
            onConnect: () => {
                // 서버의 convertAndSendToUser에 대응하는 구독 경로
                client.subscribe(`/single/notifications/${userId}`, (message) => {
                    const newNoti = JSON.parse(message.body);
                    console.log(newNoti);

                    // 1. 공통: 어떤 알림이 오든 목록을 즉시 갱신 (비동기 동기화)
                    if (refreshGroupList) refreshGroupList();

                    if (newNoti.ntype === "GROUP_DELETED") {
                        // 현재 내가 보고 있는 페이지가 삭제된 그룹 페이지인지 확인
                        const queryParams = new URLSearchParams(window.location.search);
                        const currentGroupId = queryParams.get("groupId");

                        if (currentGroupId && Number(currentGroupId) === newNoti.inviteNum) {
                            alert(`참여중인 가계부 [${newNoti.message}]가 삭제되었습니다.`);
                            navigate("/mypage", { replace: true });
                        }
                    } else if (newNoti.ntype === "INVITE") {
                        //일반 알림
                        setNotifications((prev) => [newNoti, ...prev]); 
                    } else{
                        //다른 알림
                        setNotifications((prev) => [newNoti, ...prev]); 
                    }
                });
            },
            onStompError: (frame) => console.error("STOMP 에러:", frame),
        });

        client.activate();

        return () => client.deactivate();
    }, [userId,refreshGroupList]);

    return { notifications, setNotifications };
};

export default useAlarmSocket;
