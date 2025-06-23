// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface SubmissionStats {
  count: number;
  difficulty: string;
}

interface Submission {
  title: string;
  titleSlug: string;
  statusDisplay: string;
  timestamp: number;
  lang: string;
}
interface ProfileData {
  matchedUser: {
    username: string;
    profile: {
      userAvatar: string;
    };
    submitStats: {
      acSubmissionNum: SubmissionStats[];
    };
    submissionCalendar: string;
  };
  recentSubmissionList: Array<{
    title: string;
    titleSlug: string;
    statusDisplay: string;
    timestamp: number;
    lang: string;
  }>;
}

export default function Home() {
  const [username, setUsername] = useState('');
  const [userList, setUserList] = useState<string[]>(() => {
    // Load from localStorage on first render
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('leetcodeUserList');
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });
  const [data, setData] = useState<ProfileData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Save userList to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('leetcodeUserList', JSON.stringify(userList));
  }, [userList]);

  // Optionally, fetch profiles on mount if userList is not empty
  useEffect(() => {
    if (userList.length > 0) {
      fetchProfiles(userList);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addUser = async () => {
    const trimmed = username.trim();
    if (trimmed && !userList.includes(trimmed)) {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/leetcode?username=${trimmed}`);
        const json = await res.json();
        if (
          !res.ok ||
          !json.matchedUser ||
          !json.matchedUser.profile
        ) {
          throw new Error(json.error || `Invalid username: ${trimmed}`);
        }
        const newList = [...userList, trimmed];
        setUserList(newList);
        setUsername('');
        // Filter today's accepted submissions and unique problems
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = Math.floor(today.getTime() / 1000);
        json.recentSubmissionList = json.recentSubmissionList
          .filter((submission: Submission) => submission.timestamp >= startOfDay)
          .filter((submission: { statusDisplay: string }) => submission.statusDisplay === 'Accepted')
          .filter(
            (submission: { titleSlug: string }, idx: number, arr: Submission[]) =>
              arr.findIndex((s) => s.titleSlug === submission.titleSlug) === idx
          );
        setData([...data, json]);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError('Unknown error occurred');
      }
      setLoading(false);
    }
  };

  const removeUser = (name: string) => {
    setUserList(userList.filter((u) => u !== name));
    setData(data.filter((profile) => profile.matchedUser.username !== name));
  };

  // Update fetchProfiles to accept an optional list
  const fetchProfiles = async (list = userList) => {
    setError('');
    setLoading(true);
    setData([]);
    try {
      const results: ProfileData[] = [];
      for (const name of list) {
        const res = await fetch(`/api/leetcode?username=${name}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `Failed to fetch for ${name}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfDay = Math.floor(today.getTime() / 1000);
        json.recentSubmissionList = json.recentSubmissionList
          .filter((submission: Submission) => submission.timestamp >= startOfDay)
          .filter((submission: { statusDisplay: string }) => submission.statusDisplay === 'Accepted')
          .filter(
            (submission: { titleSlug: string }, idx: number, arr: Submission[]) =>
              arr.findIndex((s) => s.titleSlug === submission.titleSlug) === idx
          );
        results.push(json);
      }
      setData(results);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Unknown error occurred');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-center">LeetCode Friends</h1>
        <div className="flex mb-4">
          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="flex-1 p-2 rounded bg-gray-800 border border-gray-600"
            onKeyDown={async (e) => { if (e.key === 'Enter') await addUser(); }}
          />
          <button
            onClick={addUser}
            className="ml-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
            disabled={loading}
          >
            Add User
          </button>
        </div>
        {loading && (
          <div className="mb-4 text-center text-purple-400 font-semibold">Fetching...</div>
        )}
        {userList.length > 0 && (
          <div suppressHydrationWarning className="mb-4 flex flex-wrap gap-2">
            {userList.map((u) => (
              <span key={u} className="bg-gray-700 px-3 py-1 rounded-full flex items-center">
                {u}
                <button
                  onClick={() => removeUser(u)}
                  className="ml-2 text-red-400 hover:text-red-600"
                  title="Remove"
                >
                </button>
              </span>
            ))}
          </div>
        )}
        {error && <p className="text-red-500">{error}</p>}
        {data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.map((profile) => (
              <div key={profile.matchedUser.username} className="bg-gray-800 p-4 rounded shadow mt-4">
                <div className="flex items-center mb-4">
                  <Image
                  src={profile.matchedUser.profile.userAvatar}
                  alt="avatar"
                  width={48}
                  height={48}
                  className="rounded-full mr-4 border border-gray-600"
                />
                  <h2 className="text-xl font-semibold">{profile.matchedUser.username}</h2>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {profile.matchedUser.submitStats.acSubmissionNum.map((s) => (
                    <div
                      key={s.difficulty}
                      className="bg-gray-700 p-3 rounded text-center"
                    >
                      <h3 className="text-lg font-bold">{s.difficulty}</h3>
                      <p className="text-2xl">{s.count}</p>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center mb-2">
                  <h3 className="text-lg font-bold mr-2">Submissions made today:</h3>
                  <span className="text-gray-400">{profile.recentSubmissionList.length} submission(s)</span>
                  </div>
                  {profile.recentSubmissionList.length === 0 ? (
                    <p className="text-gray-400">No submissions today.</p>
                  ) : (
                    <ul className="space-y-2">
                      {profile.recentSubmissionList.map((sub, idx) => (
                        <li key={idx} className="bg-gray-700 p-2 rounded flex justify-between items-center">
                          <div>
                            <a
                              href={`https://leetcode.com/problems/${sub.titleSlug}/description/`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-purple-400 hover:underline inline-flex items-center"
                            >
                              {sub.title}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="ml-1 w-4 h-4 inline-block"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14 3h7m0 0v7m0-7L10 14m-4 0v7h7" />
                              </svg>
                            </a>
                            <span className="ml-2 text-sm text-gray-400">({sub.lang})</span>
                          </div>
                          <span
                            className={
                              sub.statusDisplay === 'Accepted'
                                ? 'text-green-400'
                                : 'text-red-400'
                            }
                          >
                            {sub.statusDisplay}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}