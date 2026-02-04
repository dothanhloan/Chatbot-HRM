import ChatPage from './ChatPage';

const managerQuestions = [
  "Ai trong phòng tôi đi muộn hôm nay?",
  "Tiến độ các dự án đang quản lý",
  "Danh sách công việc trễ hạn",
  "Xuất báo cáo chấm công tháng này",
];

export default function ManagerChatPage() {
  return (
    <ChatPage 
      roleTitle="Quản lý"
      roleColor="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
      suggestedQuestions={managerQuestions}
    />
  );
}
