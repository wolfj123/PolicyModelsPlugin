import * as React from 'react';
import './SingleAnswer.css';


/**
 * This component responsible to render the answer.txt editor.
 * @param   {File} fileData    file object data.
 * @param   {string} content    file content
 * @param   {onSaveCallback} onFileChange    onFileChange handler
 * @param   {any} additionalInfo
*/

interface Props {
  content: string;
  onFileChange(content: string): void;
  additionalInfo: any;
}

const AnswersFileContent: React.FunctionComponent<Props> = (props) => {
  const { content, onFileChange, additionalInfo } = props;
  const {answersToRemove} = additionalInfo;
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
        ? Object.entries(answersData).map(([originalAnswer, value]) => {
            const shouldBeRemove = answersToRemove.includes(originalAnswer);
            return <SingleAnswer shouldBeRemove={shouldBeRemove} key={originalAnswer} text={originalAnswer} value={value} onChange={onChangeInput} />;
          })
        : 'Cannot parse this file.'}
    </>
  );
};

function SingleAnswer(props) {
  const { value, text, onChange, shouldBeRemove = false } = props;

  const onChangeInput = (event: any) => {
    const newValue = event.target.value;
    onChange(text, newValue);
  };
  return (
    <div style={{ display: 'flex', margin: '9px 3px', height: '23px',alignItems: 'center',justifyContent: 'center'}}>
      {shouldBeRemove && (
        <div
          style={{ display: 'flex' ,marginRight: '4px' }}
          dangerouslySetInnerHTML={{
            __html:
              '<svg version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"	 viewBox="0 0 512.001 512.001" style="height: 20px; width: 20px;fill: #ad1e1e;" xml:space="preserve"><g>	<g>		<path d="M503.839,395.379l-195.7-338.962C297.257,37.569,277.766,26.315,256,26.315c-21.765,0-41.257,11.254-52.139,30.102			L8.162,395.378c-10.883,18.85-10.883,41.356,0,60.205c10.883,18.849,30.373,30.102,52.139,30.102h391.398			c21.765,0,41.256-11.254,52.14-30.101C514.722,436.734,514.722,414.228,503.839,395.379z M477.861,440.586			c-5.461,9.458-15.241,15.104-26.162,15.104H60.301c-10.922,0-20.702-5.646-26.162-15.104c-5.46-9.458-5.46-20.75,0-30.208			L229.84,71.416c5.46-9.458,15.24-15.104,26.161-15.104c10.92,0,20.701,5.646,26.161,15.104l195.7,338.962			C483.321,419.836,483.321,431.128,477.861,440.586z"/>	</g></g><g>	<g>		<rect x="241.001" y="176.01" width="29.996" height="149.982"/>	</g></g><g>	<g>		<path d="M256,355.99c-11.027,0-19.998,8.971-19.998,19.998s8.971,19.998,19.998,19.998c11.026,0,19.998-8.971,19.998-19.998			S267.027,355.99,256,355.99z"/>	</g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></svg>',
          }}
        />
      )}
      <div style={{ flex: '1 1 50%' }}>{text} :</div>
      <div style={{ flex: '1 1 50%' }}>
        <input type="text" placeholder={text} value={value} onChange={onChangeInput} />
      </div>
    </div>
  );
}

export default AnswersFileContent;
