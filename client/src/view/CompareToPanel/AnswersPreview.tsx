import * as React from 'react';
interface Props {
	content: string;
}

const AnswersPreview: React.FunctionComponent<Props> = (props) => {
  const { content } = props;

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

 const answersData = parseContentToAnswers(content);
  return (
    <>
      {Object.entries(answersData).map(([originalAnswer, value]) =>
      <div key={originalAnswer + value} style={{ display: 'flex', margin: '9px 3px', height: '23px' }}>
      <div style={{flex: '1 1 30%'}}>{originalAnswer} :</div>
      <div style={{flex: '1 1 50%'}}>{value}</div>
    </div>
      )}
    </>
  );
};


export default AnswersPreview;
