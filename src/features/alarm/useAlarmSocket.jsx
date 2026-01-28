import { useEffect, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const useAlarmSocket = (userId) => {
    const [notifications, setNotifications] = useState([]);
    const [stompClient, setStompClient] = useState(null);

    useEffect(() => {
        if (!userId) return; //유저 정보 없으면 리턴

        const client = new Client({
            webSocketFactory: () => new SockJS("http://localhost:8080/osori/ws"),
            onConnect: () => {
                console.log("소켓 연결 성공");
                
                // 서버의 convertAndSendToUser에 대응하는 구독 경로
                client.subscribe(`/single/notifications/${userId}`, (message) => {
                    console.log("실시간 메시지 도착: ",message.body)
                    const newNoti = JSON.parse(message.body);
                    setNotifications((prev) => [newNoti, ...prev]);
                    //setNotifications((prev) => [newNoti, ...prev].slice(0, 5)); // 최신 5개 유지
                });
            },
            onStompError: (frame) => console.error("STOMP 에러:", frame),
        });

        client.activate();
        //setStompClient(client);

        return () => client.deactivate();
    }, [userId]);

    return { notifications, setNotifications };
};

export default useAlarmSocket;
