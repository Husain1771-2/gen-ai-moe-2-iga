import { useState, useEffect } from 'react';
import { toJSON } from '../utilities';
import { get, post } from 'aws-amplify/api';
import { ProgressBar } from '../components/ProgressBar';
import Button from '../components/FButton';
import { useNavigate } from 'react-router-dom';

export interface Question {
  QuestionText: string;
  SK: string;
  Options: Option[];
  PK?: string;
}

export interface Option {
  text: string;
  isCorrect: boolean;
}

const optionsStyle =
  'bg-white border border-gray-300 p-2 text-black text-lg my-4 hover:cursor-pointer hover:bg-gray-300';

const getLevelFromQuestion = (question: string) => {
  return question.split('#')[1];
}

export const QuestionsByLevel = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showResults, setShowResults] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [streakCount, setStreakCount] = useState<number | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    toJSON(
      get({
        apiName: 'myAPI',
        path: '/getQuestionsByLevel',
      }),
    )
      .then((response) => {
        setQuestions(response);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching questions:', error);
        setLoading(false);
      });
  }, []);

  const handleOptionClick = (isCorrect: boolean) => {
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }

    if (currentQuestionIndex + 1 < questions.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleTestDone = async () => {
    try {
      const response = await toJSON(
        post({
          apiName: 'myAPI',
          path: '/incrementStreaks',
        }),
      );

      if (response && response.Attributes && response.Attributes.StreakCounter) {
        setStreakCount(response.Attributes.StreakCounter);
        setShowPopup(true);
      } else {
        navigate('/Exercises');
      }
    } catch (error) {
      console.error('Error incrementing streak:', error);
      navigate('/Exercises');
    }
  };

  const handleContinue = () => {
    navigate('/Exercises');
  };
  const progressPercentage = (currentQuestionIndex + 1) / questions.length;

  if (loading) {
    return (
      <main className="bg-[#FBF9F1] h-full min-h-screen flex justify-center items-center">
        <h1>Loading...</h1>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="bg-[#FBF9F1] h-full min-h-screen flex justify-center items-center">
        <h1>No questions available</h1>
      </main>
    );
  }


  if (showResults) {
    return (
      <main className="bg-[#FBF9F1] h-full min-h-screen flex flex-col items-center justify-center">
        <section className="w-full sm:w-3/4 md:w-1/2 bg-white flex flex-col items-center border p-10">
          <h2 className="text-2xl md:text-3xl pb-8 font-semibold text-center text-blue-4">
            Results
          </h2>
          <p className="text-xl">
            You scored <span className="font-bold">{score}</span> out of{' '}
            <span className="font-bold">{questions.length}</span>.
          </p>
          <div style={{ marginTop: '20px' }} onClick={handleTestDone}>
            <Button label="Continue" tag="3B828E" />
          </div>
        </section>

        {showPopup && streakCount && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="text-4xl mb-4">🎉🥳🎊</div>
              <h2 className="text-2xl mb-2">Congratulations!</h2>
              <p className="mb-4">You've increased your streak to {streakCount}!</p>
              <button
                onClick={handleContinue}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </main>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <main className="bg-[#FBF9F1] h-full min-h-screen flex flex-col items-center">
      <section className="w-full sm:w-3/4 md:w-1/2 flex flex-col items-center">
        <div
          className="w-full bg-white flex flex-col border p-10"
          key={`Question-${currentQuestion.SK}`}
        >
          <h2 className="text-2xl md:text-3xl pb-8 font-semibold text-center text-blue-4">
            Questions For Level {getLevelFromQuestion(currentQuestion.PK!)}
          </h2>

          <h3 className="text-xl pt-8">
            {currentQuestionIndex + 1}. {currentQuestion.QuestionText}
          </h3>

          <div className="">
            {currentQuestion.Options.map((option, index) => (
              <div
                key={index}
                className={optionsStyle}
                onClick={() => handleOptionClick(option.isCorrect)}
              >
                {option.text}
              </div>
            ))}
          </div>
        </div>

        <div className="w-full bg-white flex items-center border p-5 mt-5">
          <ProgressBar percentage={progressPercentage}></ProgressBar>
          <span className="text-gray-500 text-sm ml-3">
            {currentQuestionIndex + 1}/{questions.length}
          </span>
        </div>
      </section>
    </main>
  );
};

export default QuestionsByLevel;
