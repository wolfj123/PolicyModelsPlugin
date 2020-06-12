import * as React from 'react';
import './Text.css';

/**
 * Staylable text component.
 *
 * @param  {ItemMenuData[]} languagesMenuData languages menu data file
 * @param  {ItemMenuData[]} filesMenuData files menu data file
*/
interface Props {
  children: any;
  onClick?: any;
  isSelected?: boolean;
  color?: string;
  size?: string;
  bold?: boolean;
}

const Text: React.FunctionComponent<Props> = (props) => {
  const { onClick, children, isSelected = false, color, size,bold } = props;

  const classNames = ['text'];
  isSelected && classNames.push('selectedText');
  !!onClick && classNames.push('clickable');
  if (bold) classNames.push('bold');

  const textStyle = {};
  if (size) textStyle['fontSize'] = size;
  if (color) textStyle['color'] = color;
  if (bold) textStyle['bold'] = color;

  return (
    <div onClick={onClick} className={classNames.join(' ')} style={textStyle}>
      {children}
    </div>
  );
};

export default Text;
