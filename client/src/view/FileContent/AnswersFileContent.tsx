import * as React from 'react';
import './SingleAnswer.css';
interface Props {
	content: string;
	onFileChange(content: string): void;
}

const AnswersFileContent: React.FunctionComponent<Props> = (props) => {
  const { content,onFileChange } = props;
  const [answersData, setAnswersData] = React.useState(parseContentToAnswers(content));

  function parseContentToAnswers(content) {
    const splittedAnswers = content.split('\n');
    return splittedAnswers.reduce((accumulator, answer) => {
      if (answer !== '') {
        const [originalAnswer, value] = answer.split(':');
        accumulator[originalAnswer] = value;
      }
      return accumulator;
    }, {});
  }

  React.useEffect(() => onFileChange(parseAnswerDataToContent()), [answersData]);

  function parseAnswerDataToContent() {
    return Object.entries(answersData).reduce((acc, answerData) => {
      const [originalAnswer, value] = answerData;
      return acc + `${originalAnswer}:${value}\n`;
    }, '');
  }

  function onChangeInput(text, newValue) {
    const newAnswersData = { ...answersData };
    newAnswersData[text] = newValue;
    setAnswersData(newAnswersData);
  }

  return (
    <>
      {answersData
        ? Object.entries(answersData).map(([originalAnswer, value]) => <SingleAnswer text={originalAnswer} value={value} onChange={onChangeInput} />)
        : 'Cannot parse this file.'}
    </>
  );
};

function SingleAnswer(props) {
  const { value, text, onChange } = props;

  const onChangeInput = (event: any) => {
    const newValue = event.target.value;
    onChange(text, newValue);
  };
  return (
    <div style={{ display: 'flex', margin: '9px 3px' }}>
      <div style={{flex: '1 1 50%'}}>{text} :</div>
      <div style={{flex: '1 1 50%'}}>
        <input type="text" placeholder={text} value={value} onChange={onChangeInput} />
      </div>
    </div>
  );
}

export default AnswersFileContent;
