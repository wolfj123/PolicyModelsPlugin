import * as React from 'react';
import './Text.css';

interface Props {
  children: any;
  icon: any;
  Left?: boolean;
  onHover?: boolean;
}

const IconWrapper: React.FunctionComponent<Props> = (props) => {
  const { children, icon, Left = false, onHover = true } = props;
	let Components = [<div className={'icon'}>{icon}</div>, children];
	if(!Left){
		Components.reverse();
	}
  return (
    <div className={onHover ? 'showIconOnHoverWrapper' : 'showIconWrapper'}>
			{Components}
    </div>
  );
};

export default IconWrapper;
