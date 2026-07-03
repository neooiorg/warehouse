import type { Conversation } from './types';

export const initialConversations: Conversation[] = [
  {
    id: 'dock-delay',
    name: 'Minh từ vận hành',
    title: 'Xe nhập trễ tại dock 03',
    status: 'online',
    unread: 2,
    initials: 'MV',
    messages: [
      {
        id: 'dock-1',
        sender: 'contact',
        author: 'Minh',
        text: 'Xe 51C-248.19 vừa báo trễ 20 phút. Mình đã giữ dock 03 và chuyển một xe xuất sang dock 02.',
        timestamp: '10:02'
      },
      {
        id: 'dock-2',
        sender: 'user',
        author: 'Bạn',
        text: 'Ổn. Kiểm tra giúp mình lô lạnh có bị ảnh hưởng không.',
        timestamp: '10:05'
      },
      {
        id: 'dock-3',
        sender: 'contact',
        author: 'Minh',
        text: 'Không ảnh hưởng. Lô lạnh vẫn vào đúng khung 10:40, nhân sự bốc dỡ đã được giữ lại.',
        timestamp: '10:08'
      }
    ],
    quickReplies: [
      'Cập nhật lại lịch dock giúp mình.',
      'Gửi danh sách xe bị ảnh hưởng.',
      'Báo bảo vệ mở cổng khi xe đến.'
    ],
    autoReplies: [
      'Đã cập nhật lịch dock và gửi cho đội kho.',
      'Mình vừa gửi danh sách 3 xe bị đổi dock.',
      'Đã báo bảo vệ. Khi xe tới sẽ cho vào thẳng khu chờ.'
    ]
  },
  {
    id: 'inventory-check',
    name: 'Lan từ kiểm kê',
    title: 'Chênh lệch tồn SKU WH-1042',
    status: 'online',
    unread: 0,
    initials: 'LK',
    messages: [
      {
        id: 'inventory-1',
        sender: 'user',
        author: 'Bạn',
        text: 'Tồn hệ thống của SKU WH-1042 đang lệch 12 thùng so với đếm thực tế.',
        timestamp: '09:15'
      },
      {
        id: 'inventory-2',
        sender: 'contact',
        author: 'Lan',
        text: 'Mình đã kiểm tra giao dịch. Có một phiếu xuất ghi nhận thiếu bước xác nhận vị trí.',
        timestamp: '09:18'
      },
      {
        id: 'inventory-3',
        sender: 'user',
        author: 'Bạn',
        text: 'Khóa lô đó lại trước, đừng cho pick tiếp tới khi đối soát xong.',
        timestamp: '09:22'
      },
      {
        id: 'inventory-4',
        sender: 'contact',
        author: 'Lan',
        text: 'Đã khóa lot LOT-2026-0142 và ghi chú cho ca chiều.',
        timestamp: '09:25'
      }
    ],
    quickReplies: [
      'Mở biên bản điều chỉnh tồn.',
      'Gửi mình lịch sử giao dịch.',
      'Kiểm tra thêm vị trí kế bên.'
    ],
    autoReplies: [
      'Biên bản đã tạo, đang chờ trưởng ca duyệt.',
      'Mình vừa gửi lịch sử giao dịch của lot vào email.',
      'Vị trí kế bên không có lệch. Chỉ có LOT-2026-0142 cần xử lý.'
    ]
  },
  {
    id: 'security-session',
    name: 'Huy từ bảo mật',
    title: 'Phiên đăng nhập bất thường',
    status: 'offline',
    unread: 1,
    initials: 'HB',
    messages: [
      {
        id: 'security-1',
        sender: 'contact',
        author: 'Huy',
        text: 'Hệ thống phát hiện một phiên đăng nhập mới từ thiết bị lạ. Mình đã tạm khóa phiên đó.',
        timestamp: 'Hôm qua'
      },
      {
        id: 'security-2',
        sender: 'user',
        author: 'Bạn',
        text: 'Không phải mình. Thu hồi phiên đó và bật xác thực hai lớp cho tài khoản giúp mình.',
        timestamp: 'Hôm qua'
      }
    ],
    quickReplies: [
      'Gửi danh sách phiên đang hoạt động.',
      'Đặt lại mật khẩu cho mình.',
      'Phiên đó có truy cập dữ liệu không?'
    ],
    autoReplies: [
      'Đã thu hồi các phiên lạ. Mình đã gửi hướng dẫn bật xác thực hai lớp.',
      'Đã gửi liên kết đặt lại mật khẩu tới email chính.',
      'Không có dữ liệu nào bị truy cập. Phiên bị chặn trước khi gọi API.'
    ]
  }
];
