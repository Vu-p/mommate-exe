import { InputHTMLAttributes, ReactNode } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  endAdornment?: ReactNode;
}

const Input = ({ label, type = 'text', placeholder, endAdornment, ...props }: InputProps) => {
  return (
    <div className="input-field">
      {label && <label className="input-label">{label}</label>}
      <div className="input-control-wrapper">
        <input
          type={type}
          placeholder={placeholder}
          className={`input-control${endAdornment ? ' has-end-adornment' : ''}`}
          {...props}
        />
        {endAdornment && <div className="input-end-adornment">{endAdornment}</div>}
      </div>
    </div>
  );
};

export default Input;
