import ChatPage from './ChatPage';

const adminQuestions = [
  "Thống kê nhân viên theo phòng ban",
  "Dự án nào đang bị trễ hạn",
  "Có bao nhiêu nhân viên chưa chấm công?",
  "Danh sách công việc quá hạn",
];

export default function AdminChatPage() {
  return (
    <ChatPage 
      roleTitle="Quản trị viên"
      roleColor="linear-gradient(135deg, #5e74d4 0%, #764ba2 100%)"
      suggestedQuestions={adminQuestions}
    />
  );
}
