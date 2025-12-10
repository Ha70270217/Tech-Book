import React from 'react';
import MDXComponents from '@theme-original/MDXComponents';
import Details from '@theme/Details';
// ❌ Removed invalid import
// import Summary from '@theme/Summary';

const Exercise = ({ children, type, difficulty }) => {
  return (
    <div className="exercise-container">
      <div className="exercise-header">
        <span className="exercise-type">{type || 'Exercise'}</span>
        {difficulty && <span className={`difficulty difficulty-${difficulty}`}>{difficulty}</span>}
      </div>
      <div className="exercise-content">
        {children}
      </div>
    </div>
  );
};

const Solution = ({ children }) => {
  return (
    <Details>
      <summary>Solution</summary>
      <div className="solution-content">
        {children}
      </div>
    </Details>
  );
};

// … rest unchanged

const LearningObjective = ({ children }) => {
  return (
    <div className="learning-objective">
      <h4>Learning Objective</h4>
      <p>{children}</p>
    </div>
  );
};

const Prerequisite = ({ children }) => {
  return (
    <div className="prerequisite">
      <h4>Prerequisite</h4>
      <p>{children}</p>
    </div>
  );
};

const KeyTerm = ({ children, definition }) => {
  return (
    <abbr title={definition} className="key-term">
      {children}
    </abbr>
  );
};

const CustomMDXComponents = {
  ...MDXComponents,
  Exercise,
  Solution,
  LearningObjective,
  Prerequisite,
  KeyTerm,
};

export default CustomMDXComponents;