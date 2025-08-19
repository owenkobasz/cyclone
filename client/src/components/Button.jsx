import { useState } from 'react';
import ButtonSvg from '../assets/svg/ButtonSvg';
import ButtonGlow from '../assets/svg/ButtonGlow';

const Button = ({ className, href, children, onClick, px, white, outline, disabled }) => {
  const [isHovered, setIsHovered] = useState(false);
  const baseClasses = `button relative inline-flex items-center justify-center h-11 transition-all duration-300 hover:text-color-1 hover:scale-105 ${px || 'px-7'}`;
  const colorClasses = white ? 'text-n-8' : 'text-n-1';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '';
  const classes = `${baseClasses} ${colorClasses} ${disabledClasses} ${className || ''}`;
  const spanClasses = 'relative z-10';

  const renderButton = () => (
    <button 
      className={classes} 
      onClick={onClick} 
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={spanClasses}>{children}</span>
      {ButtonSvg(white, !white)}
    </button>
  );

  const renderLink = () => (
    <a 
      href={href} 
      className={classes}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className={spanClasses}>{children}</span>
      {ButtonSvg(white, !white)}
    </a>
  );
  // If href is provided, render as a link; otherwise, render as a button
  return href ? renderLink() : renderButton();
}
export default Button;
