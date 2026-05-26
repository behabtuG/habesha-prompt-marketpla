"use client";

import { useState } from "react";
import { Sparkles, Upload, ArrowLeft, Image as ImageIcon, Type, DollarSign, FileText, Eye, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

export default function SharePromptPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Images",
    priceStars: "",
    priceTon: "",
    priceLocal: "",
    fullContent: "",
    previewContent: "",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });
      if (imageFile) {
        data.append("image", imageFile);
      }

      const response = await api.post("/prompts", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        setIsSuccess(true);
      } else {
        throw new Error(response.data.message || "Failed to submit prompt");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "An error occurred while submitting");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-4">Prompt Submitted!</h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto mb-8">
          Your prompt has been successfully submitted for review. It will appear on the marketplace once approved by an administrator.
        </p>
        <Link href="/">
          <Button className="h-14 px-8 rounded-[2rem] bg-black text-white font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-black/10">
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-12">
        <Link href="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black tracking-tight">Share a Prompt</h1>
          <p className="text-slate-400 font-medium">Contribute your creations to the marketplace</p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm">
        <form className="space-y-8" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Type className="w-4 h-4" /> Prompt Title
            </label>
            <Input 
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              placeholder="e.g., Cyberpunk Cityscape 4K" 
              className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-medium focus:ring-black"
            />
          </div>

          {/* Description */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Description
            </label>
            <Textarea 
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              placeholder="What does this prompt create? Describe the style and atmosphere." 
              className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50/50 p-6 font-medium focus:ring-black"
            />
          </div>

          {/* Category */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-slate-400">Category</label>
            <select 
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className="w-full h-14 rounded-2xl border border-slate-100 bg-slate-50/50 px-6 font-medium appearance-none focus:ring-2 focus:ring-black outline-none"
            >
              <option value="Images">Images</option>
              <option value="Code">Code</option>
              <option value="Writing">Writing</option>
              <option value="Business">Business</option>
            </select>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Pricing
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Stars</span>
                <Input 
                  name="priceStars"
                  value={formData.priceStars}
                  onChange={handleInputChange}
                  type="number"
                  required
                  min="0"
                  placeholder="100" 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-medium focus:ring-black"
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">TON Price</span>
                <Input 
                  name="priceTon"
                  value={formData.priceTon}
                  onChange={handleInputChange}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0" 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-medium focus:ring-black"
                />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400">Local Price (ETB)</span>
                <Input 
                  name="priceLocal"
                  value={formData.priceLocal}
                  onChange={handleInputChange}
                  type="number"
                  min="0"
                  placeholder="0" 
                  className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 px-6 font-medium focus:ring-black"
                />
              </div>
            </div>
          </div>

          {/* Full Content */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Full Content
            </label>
            <Textarea 
              name="fullContent"
              value={formData.fullContent}
              onChange={handleInputChange}
              required
              placeholder="The complete prompt content users will receive after purchase..." 
              className="min-h-[160px] rounded-2xl border-slate-100 bg-slate-50/50 p-6 font-medium focus:ring-black"
            />
          </div>

          {/* Preview Content */}
          <div className="space-y-3">
            <label className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4" /> Preview Content
            </label>
            <Textarea 
              name="previewContent"
              value={formData.previewContent}
              onChange={handleInputChange}
              required
              placeholder="A short preview or snippet shown to users before purchase..." 
              className="min-h-[100px] rounded-2xl border-slate-100 bg-slate-50/50 p-6 font-medium focus:ring-black"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <span className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-3">
              <ImageIcon className="w-4 h-4" /> Preview Image
            </span>
            <label className="w-full h-48 border-2 border-dashed border-slate-200 rounded-[2rem] bg-slate-50/30 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors overflow-hidden relative">
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageChange} />
              
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm">
                    <Upload className="w-5 h-5 text-slate-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    {imageFile ? imageFile.name : "Click to upload preview"}
                  </span>
                </>
              )}
            </label>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full h-16 rounded-[2rem] bg-black text-white font-black text-lg hover:bg-slate-900 transition-all shadow-xl shadow-black/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Submit for Review"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
