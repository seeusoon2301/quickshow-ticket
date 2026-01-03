import { Facebook, Instagram, Youtube, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

const API_BASE = "http://localhost:5000/api";

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((response) => {
        const cats = response.data?.categories || [];
        setCategories(cats.slice(0, 4)); // Only show first 4
      })
      .catch((err) => console.error("Failed to fetch categories:", err));
  }, []);

  return (
    <footer className="bg-black text-gray-300 px-6 md:px-16 lg:px-24 xl:px-44 pt-16 pb-10">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">

        {/* Logo + Social */}
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">QuickShow</h2>
          <p className="mt-3 text-sm text-gray-400 leading-relaxed">
            Khám phá & đặt vé những sự kiện nổi bật nhất mỗi tuần!
          </p>

          {/* Social */}
          <div className="flex gap-4 mt-5">
            {[Facebook, Instagram, Youtube, Mail].map((Icon, i) => (
              <div
                key={i}
                className="p-2 bg-white/5 rounded-full hover:bg-primary transition cursor-pointer"
              >
                <Icon size={20} className="text-white" />
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Category Links */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Khám phá</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className="hover:text-primary transition">Tất cả sự kiện</Link>
            </li>
            {categories.map((cat) => (
              <li key={cat._id}>
                <Link to={`/category/${cat.slug}`} className="hover:text-primary transition">
                  {cat.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Hỗ trợ</h3>
          <ul className="space-y-2 text-sm">
            <li className="hover:text-primary cursor-pointer">Hướng dẫn đặt vé</li>
            <li className="hover:text-primary cursor-pointer">Câu hỏi thường gặp</li>
            <li className="hover:text-primary cursor-pointer">Liên hệ</li>
            <li className="hover:text-primary cursor-pointer">Chính sách bảo mật</li>
          </ul>
        </div>

        {/* Subscribe */}
        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Nhận tin mới</h3>
          <p className="text-sm text-gray-400 mb-3">
            Nhập email để nhận sự kiện mới mỗi tuần.
          </p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email của bạn"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 text-sm text-white rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
            <button className="px-4 bg-primary rounded-lg text-sm font-semibold text-black hover:bg-primary/90">
              Gửi
            </button>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} Quickshow. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
