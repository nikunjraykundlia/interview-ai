"use client";
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, TrendingUp, AlertCircle, Lightbulb, Target, Clock, Award, MessageSquare, Star, Zap, Shield, Brain } from 'lucide-react';

interface ComprehensiveMentorReport {
  lastUpdated: string;
  totalReviews: number;
  latestInterviewRole: string;
  latestInterviewDate: string;
  overallCritique: string;
  questionQualityIssues: string;
  missedOpportunities: string;
  recommendedImprovedQuestions: string;
  actionableAdviceForInterviewerAgent: string;
}

export default function MentorPage() {
  const [report, setReport] = useState<ComprehensiveMentorReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newReviewNotification, setNewReviewNotification] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setError("Please login to view mentor reviews");
      setLoading(false);
      return;
    }

    // Set up Server-Sent Events for real-time updates
    // EventSource doesn't support custom headers, so we pass token as query parameter
    const eventSource = new EventSource(`/api/mentor/reviews/stream?token=${encodeURIComponent(token)}`);

    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connection opened');
      setIsConnected(true);
      setLoading(false);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'initial':
            setReport(data.report || null);
            console.log('Initial comprehensive mentor report loaded:', data.report ? 'Available' : 'None');
            break;
          case 'report_updated':
            setReport(data.report || null);
            
            // Show notification for updated report
            const jobRole = data.report?.latestInterviewRole || 'Unknown';
            setNewReviewNotification(`Mentor report updated with ${data.newReviewsCount || 1} new review(s) for ${jobRole} interview!`);
            setTimeout(() => setNewReviewNotification(null), 5000);
            
            console.log('Comprehensive mentor report updated:', data.newReviewsCount || 1, 'new review(s)');
            break;
          case 'keepalive':
            // Just a keep-alive message, no action needed
            break;
          case 'error':
            console.error('SSE error:', data.message);
            setError(data.message || 'Connection error');
            break;
        }
      } catch (parseError) {
        console.error('Error parsing SSE data:', parseError);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      setIsConnected(false);
      setError('Connection to real-time updates failed. Please refresh the page.');
      
      // Fallback to regular API call if SSE fails
      fetchFallbackReport();
    };

    eventSource.addEventListener('close', () => {
      console.log('SSE connection closed');
      setIsConnected(false);
    });

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  // Fallback function for when SSE fails
  const fetchFallbackReport = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const response = await fetch("/api/mentor/reviews", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReport(data.report || null);
        setError(null);
      }
    } catch (error) {
      console.error("Fallback fetch error:", error);
      setError("Failed to load mentor report. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Brain className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
          <p className="text-center text-white mt-6 text-lg font-medium">Loading comprehensive mentor report...</p>
          <p className="text-center text-purple-200 mt-2 text-sm">Analyzing your interview performance</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-sm rounded-2xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Connection Error</h2>
            <p className="text-red-300">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-full px-6 py-3 mb-6">
            <Brain className="w-6 h-6 text-purple-400" />
            <span className="text-purple-300 font-medium">Mentor Agent Dashboard</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mentor Insights
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Personalized Feedback to help you master your Interview Skills!
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-purple-300">
              {isConnected ? 'Real-time updates active' : 'Connection lost'}
            </span>
          </div>
        </div>

        {/* Notification Toast */}
        {newReviewNotification && (
          <div className="fixed top-6 right-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 backdrop-blur-sm border border-green-400/20 transform transition-all duration-500 animate-in slide-in-from-right">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-semibold">New Review Available!</p>
              <p className="text-sm text-green-100">{newReviewNotification}</p>
            </div>
          </div>
        )}
      
        {!report ? (
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-12 text-center">
            <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="w-12 h-12 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">No Mentor Feedback Yet</h2>
            <p className="text-lg text-purple-200 max-w-2xl mx-auto leading-relaxed">
              Start your journey to interview excellence! Complete interviews and request mentor reviews to receive personalized feedback that helps you ask stronger, more targeted questions.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <div className="flex items-center gap-2 text-purple-300">
                <Star className="w-5 h-5" />
                <span>Personalized Insights</span>
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <TrendingUp className="w-5 h-5" />
                <span>Performance Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-purple-300">
                <Target className="w-5 h-5" />
                <span>Goal-Oriented Feedback</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Award className="w-8 h-8 text-purple-400" />
                  <span className="text-3xl font-bold text-white">{report.totalReviews}</span>
                </div>
                <p className="text-purple-200 font-medium">Total Reviews</p>
                <p className="text-purple-300 text-sm mt-1">Interviews analyzed</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Target className="w-8 h-8 text-blue-400" />
                  <span className="text-xl font-bold text-white truncate">{report.latestInterviewRole}</span>
                </div>
                <p className="text-blue-200 font-medium">Latest Role</p>
                <p className="text-blue-300 text-sm mt-1">Most recent interview</p>
              </div>
              
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="w-8 h-8 text-green-400" />
                  <span className="text-xl font-bold text-white">{new Date(report.lastUpdated).toLocaleDateString()}</span>
                </div>
                <p className="text-green-200 font-medium">Last Updated</p>
                <p className="text-green-300 text-sm mt-1">Latest feedback</p>
              </div>
            </div>
          
            {/* Main Report Card */}
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-purple-500/20 rounded-3xl p-8 shadow-2xl">
              <div className="mb-8 pb-6 border-b border-purple-500/20">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Comprehensive Analysis</h3>
                    <p className="text-purple-300">{report.latestInterviewRole} Interview</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-purple-300">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(report.latestInterviewDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    <span>AI-Powered Insights</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 backdrop-blur-sm border border-red-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                      <h4 className="text-lg font-semibold text-white">Overall Critique</h4>
                    </div>
                    <p className="text-red-100 leading-relaxed whitespace-pre-wrap">{report.overallCritique}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/10 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertCircle className="w-6 h-6 text-yellow-400" />
                      <h4 className="text-lg font-semibold text-white">Question Quality Issues</h4>
                    </div>
                    <p className="text-yellow-100 leading-relaxed whitespace-pre-wrap">{report.questionQualityIssues}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm border border-purple-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Shield className="w-6 h-6 text-purple-400" />
                      <h4 className="text-lg font-semibold text-white">Actionable Advice</h4>
                    </div>
                    <p className="text-purple-100 leading-relaxed whitespace-pre-wrap">{report.actionableAdviceForInterviewerAgent}</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-6 h-6 text-blue-400" />
                      <h4 className="text-lg font-semibold text-white">Missed Opportunities</h4>
                    </div>
                    <p className="text-blue-100 leading-relaxed whitespace-pre-wrap">{report.missedOpportunities}</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 backdrop-blur-sm border border-green-500/20 rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <TrendingUp className="w-6 h-6 text-green-400" />
                      <h4 className="text-lg font-semibold text-white">Improved Questions</h4>
                    </div>
                    <p className="text-green-100 leading-relaxed whitespace-pre-wrap">{report.recommendedImprovedQuestions}</p>
                  </div>
                </div>
              </div>
              
                          </div>
          </div>
        )}
      </div>
    </main>
  );
}
