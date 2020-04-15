import * as React from 'react';
import './Text.css';

interface Props {
  children: any;
  onClick?: any;
  isSelected?: boolean;
  color?: string;
  size?: string;
}

const Text: React.FunctionComponent<Props> = (props) => {
  const { onClick, children, isSelected = false, color, size } = props;

  const classNames = ['text'];
  isSelected && classNames.push('selectedText');
  !!onClick && classNames.push('clickable');

  const textStyle = {};
  if (size) textStyle['fontSize'] = size;
  if (color) textStyle['color'] = color;

  return (
    <div onClick={onClick} className={classNames.join(' ')} style={textStyle}>
      {children}
    </div>
  );
};

export default Text;
