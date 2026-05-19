import React from 'react';

export function VipDetails() {
  return (
    <section className="px-5 py-6 space-y-4 pb-12">
      <header className="text-center mb-6">
        <h2 className="text-[#d32f2f] text-xl font-extrabold tracking-tight">ĐẲNG CẤP ĐẾ VƯƠNG</h2>
      </header>
      <div className="space-y-4 text-sm text-gray-900 leading-relaxed">
        <p className="flex items-start">
          <span className="mr-2 text-[#d32f2f] flex-shrink-0">※</span>
          <span>
            Đối tượng sự kiện: Tất cả thành viên của <b className="font-bold text-gray-950">CASINO CORONA</b>
          </span>
        </p>
        <p className="flex items-start">
          <span className="mr-2 text-[#d32f2f] flex-shrink-0">※</span>
          <span>Thời gian kết thúc: Dựa trên thông báo chính thức từ trang chủ</span>
        </p>
        <div className="pt-2">
          <p className="flex items-start text-justify">
            <span className="mr-2 text-[#d32f2f] flex-shrink-0">※</span>
            <span>
              Chi tiết sự kiện: Mong muốn mang đến những trải nghiệm đẳng cấp dành riêng cho những thành viên thân thiết. Hệ thống VIP được thiết kế nhằm tối ưu hóa quyền lợi và giá trị người chơi nhận được tại{' '}
              <b className="font-bold text-gray-950">CASINO CORONA</b>
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}
