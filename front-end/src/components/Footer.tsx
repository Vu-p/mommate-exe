import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Linkedin } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-figma">
      <div className="container footer-container-figma">
        <div className="footer-brand-figma">
          <h3>Mommate</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          <div className="social-links-figma">
            <a href="#"><Facebook size={20} /></a>
            <a href="#"><Twitter size={20} /></a>
            <a href="#"><Instagram size={20} /></a>
            <a href="#"><Linkedin size={20} /></a>
          </div>
        </div>
        
        <div className="footer-links-figma">
          <div className="link-group-figma">
            <h4>Product</h4>
            <a href="#">Features</a>
            <a href="#">Pricing</a>
            <a href="#">Case studies</a>
            <a href="#">Reviews</a>
            <a href="#">Updates</a>
          </div>
          <div className="link-group-figma">
            <h4>Company</h4>
            <a href="#">About</a>
            <a href="#">Contact us</a>
            <a href="#">Careers</a>
            <a href="#">Culture</a>
            <a href="#">Blog</a>
          </div>
          <div className="link-group-figma">
            <h4>Support</h4>
            <a href="#">Getting started</a>
            <a href="#">Help center</a>
            <a href="#">Server status</a>
            <a href="#">Report a bug</a>
            <a href="#">Chat support</a>
          </div>
        </div>
        
        <div className="footer-contact-figma">
          <h4>Contacts us</h4>
          <div className="contact-item-figma">
            <Mail size={18} />
            <span>contact@company.com</span>
          </div>
          <div className="contact-item-figma">
            <Phone size={18} />
            <span>(415) 000-0000</span>
          </div>
          <div className="contact-item-figma">
            <MapPin size={18} />
            <span>794 McAllister St San Francisco, 94102</span>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom-figma">
        <div className="container bottom-content-figma">
           <p>Copyright © 2023</p>
           <div className="bottom-links-figma">
             <p>All Rights Reserved | <a href="#">Terms and Conditions</a> | <a href="#">Privacy Policy</a></p>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
