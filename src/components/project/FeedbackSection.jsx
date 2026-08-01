import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjectFeedback, submitFeedback } from '../../services/api';
import { errorMessage } from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { TextArea, Select } from '../forms/Field';

const StarRating = ({ value, onChange, readOnly = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) =>
      readOnly ? (
        <span
          key={star}
          aria-hidden="true"
          className={star <= value ? 'text-amber-500' : 'text-slate-300'}
        >
          ★
        </span>
      ) : (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
          aria-pressed={value === star}
          className={`rounded p-0.5 text-2xl transition-colors ${
            star <= value ? 'text-amber-500' : 'text-slate-300 hover:text-amber-300'
          }`}
        >
          ★
        </button>
      )
    )}
    {readOnly && <span className="sr-only">{value} out of 5</span>}
  </div>
);

const FeedbackSection = ({ projectId }) => {
  const { isAuthenticated, user } = useAuth();
  const toast = useToast();

  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 0, difficulty: '', feedback: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    getProjectFeedback(projectId)
      .then((response) => {
        setReviews(response.data || []);
        setAverageRating(response.averageRating || 0);
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [projectId]);

  const myReview = reviews.find((r) => r.userId === user?.id);

  useEffect(() => {
    if (myReview) {
      setForm({
        rating: myReview.rating || 0,
        difficulty: myReview.difficulty || '',
        feedback: myReview.feedback || '',
      });
    }
  }, [myReview]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.rating) {
      setError('Please choose a star rating.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitFeedback({
        projectId,
        rating: form.rating,
        difficulty: form.difficulty || undefined,
        feedback: form.feedback || undefined,
      });
      toast.success(response.message);
      load();
    } catch (err) {
      setError(errorMessage(err, 'Could not save your review.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="reviews"
      className="rounded-card border border-slate-200 bg-white p-6 shadow-card"
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Teacher reviews {reviews.length > 0 && `(${reviews.length})`}
        </h2>
        {averageRating > 0 && (
          <div className="flex items-center gap-2">
            <StarRating value={Math.round(averageRating)} readOnly />
            <span className="text-sm font-semibold text-ink">{averageRating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-slate-200 bg-surface-sunken p-5">
          <h3 className="font-semibold text-ink">
            {myReview ? 'Update your review' : 'Have you tried this in class?'}
          </h3>

          <fieldset className="mt-4">
            <legend className="mb-1.5 text-sm font-medium text-ink">Your rating</legend>
            <StarRating value={form.rating} onChange={(rating) => setForm({ ...form, rating })} />
          </fieldset>

          <Select
            label="How difficult was it in practice?"
            className="mt-4"
            value={form.difficulty}
            onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          >
            <option value="">Prefer not to say</option>
            <option value="Easy">Easier than expected</option>
            <option value="Medium">About right</option>
            <option value="Hard">Harder than expected</option>
          </Select>

          <TextArea
            label="What should other teachers know?"
            className="mt-4"
            rows={3}
            maxLength={2000}
            value={form.feedback}
            onChange={(e) => setForm({ ...form, feedback: e.target.value })}
            placeholder="What worked, what to watch out for, how long it really took…"
          />

          {error && (
            <p role="alert" className="mt-3 text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" loading={submitting} className="mt-4">
            {myReview ? 'Update review' : 'Post review'}
          </Button>
        </form>
      ) : (
        <p className="mb-8 rounded-lg border border-slate-200 bg-surface-sunken px-4 py-3 text-sm text-ink-muted">
          <Link to="/signin" className="font-semibold text-brand-700 hover:underline">
            Sign in
          </Link>{' '}
          to leave a review.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-ink-subtle">Loading reviews…</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-ink-subtle">
          No reviews yet. If you run this activity, your notes would help the next teacher.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {reviews.map((review) => (
            <li key={review.id} className="py-4">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-medium text-ink">{review.userName}</span>
                {review.schoolName && (
                  <span className="text-sm text-ink-subtle">{review.schoolName}</span>
                )}
                <StarRating value={review.rating} readOnly />
                {review.difficulty && <Badge tone="info">{review.difficulty}</Badge>}
              </div>
              {review.feedback && (
                <p className="mt-2 whitespace-pre-line text-sm text-ink-muted">{review.feedback}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export default FeedbackSection;
