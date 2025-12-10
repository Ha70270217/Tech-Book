import React from 'react';
import clsx from 'clsx';
import styles from './ContentTemplate.module.css';

// Template component for different content types in the textbook
const ContentTemplate = ({ type, title, children, className }) => {
  const templateClasses = clsx(
    'textbook-content',
    styles.contentTemplate,
    className
  );

  switch (type) {
    case 'overview':
      return (
        <section className={templateClasses}>
          <div className="chapter-intro">
            <h1>{title}</h1>
            {children}
          </div>
        </section>
      );

    case 'concepts':
      return (
        <section className={templateClasses}>
          <div className={styles.conceptsSection}>
            <h1>{title}</h1>
            <div className={styles.conceptList}>
              {children}
            </div>
          </div>
        </section>
      );

    case 'examples':
      return (
        <section className={templateClasses}>
          <div className={styles.examplesSection}>
            <h1>{title}</h1>
            <div className={styles.exampleList}>
              {children}
            </div>
          </div>
        </section>
      );

    case 'exercises':
      return (
        <section className={templateClasses}>
          <div className={styles.exercisesSection}>
            <h1>{title}</h1>
            <div className="exercise-container">
              {children}
            </div>
          </div>
        </section>
      );

    case 'references':
      return (
        <section className={templateClasses}>
          <div className={styles.referencesSection}>
            <h1>{title}</h1>
            <div className="reference-list">
              {children}
            </div>
          </div>
        </section>
      );

    default:
      return (
        <section className={templateClasses}>
          <h1>{title}</h1>
          {children}
        </section>
      );
  }
};

export default ContentTemplate;