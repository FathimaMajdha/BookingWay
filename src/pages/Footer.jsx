import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="text-white mt-10 " style={{ background: "#000957" }}>
      <div className="container-fluid py-5  " style={{ background: "#000957", paddingLeft: "500px", marginLeft: "-100px" }}>
        <div className="row ">
          <div className="col-md-12 mb-4">
            <h4 className="text-2xl font-bold">BookingWay</h4>
            <p className="mt-3 text-sm">
              Your trusted partner for hotel & flight bookings. Discover the world with comfort and ease.
            </p>
          </div>

          <div className="col-md-3 mb-4">
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="list-unstyled text-sm">
              <li>
                <a href="/hotels" className="text-white">
                  Hotels
                </a>
              </li>
              <li>
                <a href="/flights" className="text-white">
                  Flights
                </a>
              </li>
              <li>
                <a href="/deals" className="text-white">
                  Deals
                </a>
              </li>
              <li>
                <a href="/contact" className="text-white">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="list-unstyled text-sm">
              <li>
                <a href="/faq" className="text-white">
                  FAQs
                </a>
              </li>
              <li>
                <a href="/terms" className="text-white">
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/help" className="text-white">
                  Help Center
                </a>
              </li>
            </ul>
          </div>

          <div className="col-md-3 mb-4">
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="list-unstyled text-sm">
              <li className="d-flex align-items-center gap-2">
                <Phone size={16} /> +91 98765 43210
              </li>
              <li className="d-flex align-items-center gap-2">
                <Mail size={16} /> support@bookingway.com
              </li>
              <li className="d-flex align-items-center gap-2">
                <MapPin size={16} /> Kochi, Kerala, India
              </li>
            </ul>
            <div className="d-flex gap-3 mt-3">
              <a href="#">
                <Facebook size={18} />
              </a>
              <a href="#">
                <Twitter size={18} />
              </a>
              <a href="#">
                <Instagram size={18} />
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="border-top py-3 text-center text-sm">
        © {new Date().getFullYear()} BookingWay. All rights reserved.
      </div>
    </footer>
  );
}
