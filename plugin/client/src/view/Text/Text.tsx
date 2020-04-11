import * as React from 'react';
import './Text.css';


interface Props {
  children: any;
  onClick?: any;
  isSelected: boolean;
}

const Text: React.FunctionComponent<Props> = props => {
	const { onClick, children, isSelected } = props;

	const classNames =['text'];
	isSelected && classNames.push('selectedText');
	!!onClick && classNames.push('clickable');

  return (
    <div onClick={onClick} className={classNames.join(' ')}>
      {children}
    </div>
  );
};

export default Text;
