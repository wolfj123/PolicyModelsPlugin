import * as React from 'react';

interface Props {
  options: string[];
  onSelect: any;
  selected: string;
}

const Select: React.FunctionComponent<Props> = props => {
  const { options, onSelect, selected } = props;

  const handleChange = event => {
    onSelect(event.target.value);
  };

  const optionsJsxList = options.map(option => <option value={option}>{option}</option>);
  return (
    <select value={selected} onChange={handleChange}>
      {optionsJsxList}
    </select>
  );
};

export default Select;
