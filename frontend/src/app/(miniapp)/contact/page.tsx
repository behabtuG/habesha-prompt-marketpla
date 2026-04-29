// app/(miniapp)/contact/page.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MessageSquare,
  Send,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import api from "@/lib/api";

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string>("");
  const [lastSubmissionTime, setLastSubmissionTime] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.subject) {
      newErrors.subject = "Please select a subject";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message should be at least 10 characters";
    } else if (formData.message.trim().length > 5000) {
      newErrors.message = "Message should not exceed 5000 characters";
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Rate limiting: 30 seconds between submissions
    const now = Date.now();
    const timeSinceLastSubmission = now - lastSubmissionTime;
    const minimumTimeBetweenSubmissions = 30000; // 30 seconds

    if (timeSinceLastSubmission < minimumTimeBetweenSubmissions) {
      const secondsLeft = Math.ceil(
        (minimumTimeBetweenSubmissions - timeSinceLastSubmission) / 1000
      );
      toast.error(
        `Please wait ${secondsLeft} seconds before submitting another message`
      );
      return;
    }

    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Please fix the errors in the form");
      return;
    }

    // Clear any existing errors
    setErrors({});

    setIsSubmitting(true);

    try {
      // Send to your backend API
      const response = await api.post("/contact", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        timestamp: new Date().toISOString(),
      });

      if (response.data.success) {
        toast.success("Message sent successfully! We'll get back to you soon.");
        setIsSuccess(true);
        setSubmissionId(response.data.data?.id || "");
        setLastSubmissionTime(Date.now());

        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });
      } else {
        toast.error(response.data.message || "Failed to send message");
      }
    } catch (error: any) {
      console.error("Failed to submit contact form:", error);

      // Provide user-friendly error messages
      if (error.response) {
        switch (error.response.status) {
          case 400:
            toast.error("Invalid form data. Please check your inputs.");
            break;
          case 401:
            toast.error("Please log in to submit the contact form.");
            break;
          case 429:
            toast.error("Too many submissions. Please try again later.");
            break;
          case 500:
            toast.error("Server error. Please try again later.");
            break;
          default:
            toast.error(
              error.response.data?.message || "Failed to send message"
            );
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSuccess(false);
    setSubmissionId("");
    setErrors({});
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {isSuccess ? (
        <SuccessMessage submissionId={submissionId} onSendAnother={resetForm} />
      ) : (
        <ContactForm
          formData={formData}
          errors={errors}
          isSubmitting={isSubmitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// Success Message Component
function SuccessMessage({
  submissionId,
  onSendAnother,
}: {
  submissionId: string;
  onSendAnother: () => void;
}) {
  return (
    <>
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Message Sent Successfully!</h1>
        <p className="text-muted-foreground">
          We've received your message and will respond within 24 hours.
        </p>
      </div>

      <Card className="max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-1 text-left">
                <li>• Our team reviews all messages within 24 hours</li>
                <li>• We'll respond to the email you provided</li>
                <li>
                  • For prompt suggestions, we'll notify you if your idea is
                  added
                </li>
                <li>• Check your spam folder if you don't see our reply</li>
              </ul>
            </div>

            {submissionId && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">Reference ID:</p>
                <p className="text-sm text-gray-600 font-mono">
                  {submissionId}
                </p>
              </div>
            )}

            <Button onClick={onSendAnother} className="w-full">
              Send Another Message
            </Button>

            <div className="pt-4">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Return to Homepage
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Contact Form Component
function ContactForm({
  formData,
  errors,
  isSubmitting,
  onChange,
  onSubmit,
}: {
  formData: any;
  errors: Record<string, string>;
  isSubmitting: boolean;
  onChange: (e: any) => void;
  onSubmit: (e: any) => void;
}) {
  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
        <p className="text-muted-foreground">
          Have questions, suggestions, or need support? We're here to help!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Mail className="w-5 h-5 text-blue-500" />
                Email Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                For prompt inquiries and general questions
              </p>
              <a
                href="mailto:support@promptmarketplace.com"
                className="text-blue-600 hover:underline font-medium"
              >
                support@promptmarketplace.com
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageSquare className="w-5 h-5 text-purple-500" />
                Prompt Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                Want to see a specific type of prompt? Let us know!
              </p>
              <p className="text-sm">
                We're always looking to expand our collection with valuable
                prompts.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-5 h-5 text-green-500" />
                Quick Support
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">
                For urgent issues with purchases or access
              </p>
              <p className="text-sm">
                Typically respond within 24 hours on business days.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={onChange}
                      placeholder="Your name"
                      disabled={isSubmitting}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={onChange}
                      placeholder="your.email@example.com"
                      disabled={isSubmitting}
                      className={errors.email ? "border-red-500" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={onChange}
                    className={`w-full px-3 py-2 border rounded-md bg-background ${
                      errors.subject ? "border-red-500" : ""
                    }`}
                    disabled={isSubmitting}
                  >
                    <option value="">Select a subject</option>
                    <option value="support">Technical Support</option>
                    <option value="suggestion">Prompt Suggestion</option>
                    <option value="bug">Report a Bug</option>
                    <option value="feedback">General Feedback</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.subject && (
                    <p className="text-sm text-red-500">{errors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={onChange}
                    placeholder="Tell us how we can help..."
                    rows={5}
                    disabled={isSubmitting}
                    className={errors.message ? "border-red-500" : ""}
                  />
                  <div className="flex justify-between">
                    {errors.message && (
                      <p className="text-sm text-red-500">{errors.message}</p>
                    )}
                    <p
                      className={`text-sm ${
                        formData.message.length > 5000
                          ? "text-red-500"
                          : "text-muted-foreground"
                      }`}
                    >
                      {formData.message.length}/5000
                    </p>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By submitting this form, you agree to our{" "}
                  <Link
                    href="/privacy"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </Link>
                  . We'll respond within 1-2 business days.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
