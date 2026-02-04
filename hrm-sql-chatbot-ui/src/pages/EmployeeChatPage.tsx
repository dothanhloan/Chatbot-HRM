import ChatPage from './ChatPage';

const employeeQuestions = [
  "Tôi đi muộn mấy lần trong tháng này",
  "Công việc nào của tôi bị trễ hạn?",
  "Công việc được giao cho tôi",
  "Các dự án của tôi tiến độ thế nào?",
];

export default function EmployeeChatPage() {
  return (
    <ChatPage 
      roleTitle="Nhân viên"
      roleColor="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
      suggestedQuestions={employeeQuestions}
    />
  );
}
