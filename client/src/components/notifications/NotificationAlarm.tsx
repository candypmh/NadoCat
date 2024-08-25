import React, { useEffect, useState } from "react";
import { BiBell } from "react-icons/bi";
import { GoDotFill } from "react-icons/go";
import useNotifications from "../../hooks/useNotifications";
import "./../../styles/scss/components/notification/notificationAlarm.scss";

interface INotificationData {
  type: string;
  sender: string;
  url: string;
  timestamp: string;
}

const NotificationAlarm: React.FC = () => {
  const [alarmExists, setAlarmExists] = useState<boolean>(false);

  const { isAllRead, isAllReadLoading } = useNotifications();
  console.log(isAllRead);

  const createEventSource = () => {
    const userId: string = "74657374320000000000000000000000";
    const eventSource = new EventSource(
      `http://localhost:3000/notifications?userId=${userId}`
    );

    eventSource.addEventListener("message", (event) => {
      try {
        const notification = JSON.parse(event.data);
        console.log(notification);
        setAlarmExists(true);
      } catch (error) {
        console.error("데이터 파싱 중 오류 발생:", error);
      }
    });

    eventSource.addEventListener("error", (error) => {
      console.error("SSE Error:", error);
      if (eventSource.readyState === EventSource.CLOSED) {
        setTimeout(createEventSource, 3000);
      }
    });

    return eventSource;
  };

  useEffect(() => {
    const eventSource = createEventSource();

    return () => {
      eventSource.close();
      console.log("SSE 연결이 닫혔습니다.");
      setAlarmExists(!isAllRead);
    };
  }, []);

  useEffect(() => {
    if (!isAllReadLoading) {
      setAlarmExists(!isAllRead);
    }
  }, [isAllRead, isAllReadLoading]);

  return (
    <div className="notification-icon">
      <BiBell className="bell-icon" />
      {alarmExists && !isAllReadLoading && <GoDotFill className="new-sign" />}
    </div>
  );
};

export default NotificationAlarm;