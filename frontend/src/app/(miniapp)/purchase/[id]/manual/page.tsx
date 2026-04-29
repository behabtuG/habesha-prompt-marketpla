// app/(miniapp)/purchase/[id]/manual-payment/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Upload,
  Copy,
  Building,
  AlertCircle,
  FileText,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ManualPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const promptId = params.id as string;

  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    referenceNumber: "",
    notes: "",
  });

  useEffect(() => {
    loadPrompt();
    initLocalPayment();
  }, [promptId]);

  const loadPrompt = async () => {
    try {
      const res = await api.get(`/prompts/${promptId}`);
      setPrompt(res.data.data);
    } catch (err: any) {
      toast.error("Failed to load prompt");
      router.push("/prompts");
    }
  };

  const initLocalPayment = async () => {
    try {
      const res = await api.post("/payments/local/initiate", { promptId });
      setPaymentInfo(res.data.data);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to initialize payment"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "application/pdf",
      ];
      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Invalid file type. Please upload an image or PDF.");
        return;
      }

      // Validate file size (5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 5MB.");
        return;
      }

      setFile(selectedFile);

      // Create preview for images
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error("Please upload your payment receipt");
      return;
    }

    if (
      !formData.bankName ||
      !formData.accountNumber ||
      !formData.referenceNumber
    ) {
      toast.error("Please fill all required fields");
      return;
    }

    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("purchaseId", paymentInfo.purchaseId);
      formDataToSend.append("bankName", formData.bankName);
      formDataToSend.append("accountNumber", formData.accountNumber);
      formDataToSend.append("referenceNumber", formData.referenceNumber);
      formDataToSend.append("notes", formData.notes);
      formDataToSend.append("receipt", file);

      const res = await api.post("/payments/local/upload", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success(
        "Receipt uploaded successfully! Admin will verify within 24 hours."
      );
      router.push(`/purchase/${promptId}/upload-success`);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.response?.data?.message || "Failed to upload receipt");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!prompt || !paymentInfo) return null;

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href={`/purchase/${promptId}`}>
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Payment Options
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Payment Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                Bank Transfer Payment
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Prompt Summary */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-bold text-lg mb-2">{prompt.title}</h3>
                <p className="text-muted-foreground mb-4">
                  {prompt.description}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">
                      {paymentInfo.amount} ETB
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Amount
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Reference
                    </div>
                    <code className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                      {paymentInfo.purchaseId}
                    </code>
                  </div>
                </div>
              </div>

              {/* Bank Account Details */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">
                  Transfer to Our Bank Account
                </h3>

                {paymentInfo.bankAccounts?.map((bank: any, index: number) => (
                  <Card key={index} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Building className="w-5 h-5 text-blue-600" />
                        <h4 className="font-bold text-lg">{bank.name}</h4>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Account Number
                          </Label>
                          <div className="flex items-center gap-2">
                            <code className="text-lg font-bold font-mono flex-1">
                              {bank.accountNumber}
                            </code>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                copyToClipboard(bank.accountNumber)
                              }
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Account Name
                          </Label>
                          <p className="text-lg font-semibold">
                            {bank.accountName}
                          </p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Branch
                          </Label>
                          <p className="font-medium">{bank.branch}</p>
                        </div>

                        <div>
                          <Label className="text-sm text-muted-foreground">
                            Amount to Transfer
                          </Label>
                          <p className="text-xl font-bold text-green-600">
                            {paymentInfo.amount} ETB
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Instructions */}
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                    <h4 className="font-bold">Important Instructions</h4>
                  </div>
                  <ul className="space-y-2 list-disc pl-5">
                    {paymentInfo.instructions?.map(
                      (instruction: string, index: number) => (
                        <li key={index} className="text-sm">
                          {instruction}
                        </li>
                      )
                    )}
                    <li className="text-sm font-semibold">
                      Use this as reference:{" "}
                      <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">
                        {paymentInfo.purchaseId}
                      </code>
                    </li>
                    <li className="text-sm">
                      After transferring, upload your receipt below
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Receipt Upload Form */}
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Upload Payment Receipt</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bankName">Bank Name *</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) =>
                        setFormData({ ...formData, bankName: e.target.value })
                      }
                      placeholder="e.g., Commercial Bank of Ethiopia"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber">Your Account Number *</Label>
                    <Input
                      id="accountNumber"
                      value={formData.accountNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          accountNumber: e.target.value,
                        })
                      }
                      placeholder="Your bank account number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="referenceNumber">
                      Transaction Reference *
                    </Label>
                    <Input
                      id="referenceNumber"
                      value={formData.referenceNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          referenceNumber: e.target.value,
                        })
                      }
                      placeholder="Transaction reference number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Input
                      id="notes"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      placeholder="Any additional information"
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <Label>Payment Receipt (Screenshot or PDF) *</Label>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="receipt"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label htmlFor="receipt" className="cursor-pointer">
                      <div className="space-y-2">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <p className="font-medium">Click to upload receipt</p>
                          <p className="text-sm text-muted-foreground">
                            PNG, JPG, PDF up to 5MB
                          </p>
                        </div>
                      </div>
                    </label>

                    {file && (
                      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="w-8 h-8 text-blue-600" />
                          <div className="flex-1">
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFile(null);
                              setPreview(null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>

                        {preview && (
                          <div className="mt-3">
                            <img
                              src={preview}
                              alt="Receipt preview"
                              className="max-h-48 mx-auto rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  size="lg"
                  className="w-full h-14 text-lg"
                  onClick={handleSubmit}
                  disabled={submitting || !file}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Uploading Receipt...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-3 h-5 w-5" />
                      Submit for Verification
                    </>
                  )}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Verification typically takes 1-24 hours during business days
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info & Status */}
        <div className="space-y-6">
          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium">Awaiting Payment</p>
                  <p className="text-sm text-muted-foreground">
                    Complete bank transfer and upload receipt
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">1</span>
                  </div>
                  <span className="font-medium">Transfer Money</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">2</span>
                  </div>
                  <span className="text-muted-foreground">Upload Receipt</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">3</span>
                  </div>
                  <span className="text-muted-foreground">
                    Admin Verification
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold">4</span>
                  </div>
                  <span className="text-muted-foreground">Get Access</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Info */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="font-medium mb-1">Support Hours</p>
                <p className="text-sm text-muted-foreground">
                  Mon-Fri: 9AM-5PM EAT
                </p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="font-medium mb-1">Verification Time</p>
                <p className="text-sm text-muted-foreground">
                  Usually within 1-24 hours
                </p>
              </div>

              <Button variant="outline" className="w-full">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
