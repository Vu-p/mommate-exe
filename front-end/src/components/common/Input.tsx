import { InputHTMLAttributes } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = ({ label, type = 'text', placeholder, ...props }: InputProps) => {
  return (
    <div className="input-field">
      {label && <label className="input-label">{label}</label>}
      <input 
        type={type} 
        placeholder={placeholder} 
        className="input-control" 
        {...props} 
      />
    </div>
  );
};

export default Input;
