"use client";

import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MessageCircle, HelpCircle } from 'lucide-react';
import { cn } from '../utils/utils';

interface FAQProps {
  onNavigate?: (screen: string) => void;
}

type FAQItem = {
  question: string;
  answer: string;
  category: string;
};

export default function FAQ({ onNavigate }: FAQProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const categories = [
    'All',
    'Ordering',
    'Delivery',
    'Pricing & Negotiation',
    'For Farmers',
    'Invoicing & Payments',
    'Account'
  ];

  const faqData: FAQItem[] = [
    // Ordering
    {
      category: 'Ordering',
      question: 'How do I place a wholesale produce order?',
      answer: 'Browse our catalog or landing page to select fresh produce batches. You can add items to your cart or submit custom counter-proposals directly to farmers.'
    },
    {
      category: 'Ordering',
      question: 'Can guests view produce without logging in?',
      answer: 'Yes! Anyone can explore local farm produce, view product specifications, and add items to their cart. You will only be prompted to log in when placing an order.'
    },
    {
      category: 'Ordering',
      question: 'What happens to my order if I log in during checkout?',
      answer: 'Your cart items are preserved seamlessly! Once you sign in or log in, your order items transfer automatically so you can finish placement.'
    },

    // Delivery
    {
      category: 'Delivery',
      question: 'How is fresh delivery scheduled and fulfilled?',
      answer: 'Orders are fulfilled through certified Harvest Hill cold-chain logistics. Scheduled morning delivery windows ensure produce arrives fresh from local fields.'
    },
    {
      category: 'Delivery',
      question: 'How do delivery notes and digital signatures work?',
      answer: 'Upon delivery, recipients inspect the produce and digitally sign the delivery note. Both clients and admins can view and export delivery notes to PDF.'
    },
    {
      category: 'Delivery',
      question: 'What should I do if items are damaged or missing?',
      answer: 'You can flag a discrepancy dispute directly on your Delivery Notes page before or during signing. Our support team immediately reviews flagged disputes.'
    },

    // Pricing & Negotiation
    {
      category: 'Pricing & Negotiation',
      question: 'How does price negotiation work between farmers and buyers?',
      answer: 'Buyers can propose custom prices on listed supplies. Farmers receive real-time notifications to accept, counter, or decline proposals.'
    },
    {
      category: 'Pricing & Negotiation',
      question: 'What are Flash Deals and how are discounts applied?',
      answer: 'Farmers can discount active produce batches from their supplies dashboard. Discounted items receive promotional badges and feature in Flash Deals.'
    },
    {
      category: 'Pricing & Negotiation',
      question: 'What units of measurement are supported?',
      answer: 'Harvest Hill supports wholesale quantities in kg, litres, crates, jars, bundles, and dozen.'
    },

    // For Farmers
    {
      category: 'For Farmers',
      question: 'How do I apply to become a farm supplier?',
      answer: 'Click "Apply to supply" on our landing page or footer to submit your farm application. Verification typically takes less than 24 hours.'
    },
    {
      category: 'For Farmers',
      question: 'Can Harvest Hill admin also submit farm harvests?',
      answer: 'Yes! Admins with local farms can submit harvests under Harvest Hill directly into the catalog supply chain.'
    },
    {
      category: 'For Farmers',
      question: 'When do farmers receive payment for delivered goods?',
      answer: 'Funds are held in escrow and released to the farmer profile as soon as the client recipient signs the digital delivery note.'
    },

    // Invoicing & Payments
    {
      category: 'Invoicing & Payments',
      question: 'How are invoices generated?',
      answer: 'Invoices are automatically created upon order delivery confirmation. You can view, download, and track payment status in your account dashboard.'
    },
    {
      category: 'Invoicing & Payments',
      question: 'What payment methods are supported?',
      answer: 'We support MTN Mobile Money (MoMo), card payments, and direct bank transfers for business procurement.'
    },

    // Account
    {
      category: 'Account',
      question: 'How do I update my profile or password?',
      answer: 'Click your user avatar icon in the top navigation bar to go directly to your role-specific profile settings page.'
    },
    {
      category: 'Account',
      question: 'Is my data secure on Harvest Hill?',
      answer: 'Yes. All authentication tokens, ledger records, and personal profiles are encrypted and protected under role-based access control.'
    }
  ];

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredFaqs = faqData.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const groupedCategories = Array.from(new Set(filteredFaqs.map(item => item.category)));

  return (
    <div className="bg-[#f5f4ef] text-[#1c1c18] font-sans min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#144227] tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-[#717971] font-semibold max-w-md mx-auto">
            Everything you need to know about fresh farm ordering, logistics, negotiations, and payments.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#717971]" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions or keywords (e.g. delivery, discount, payment)..."
            className="w-full pl-11 pr-4 py-3 bg-white border border-[#c1c9c0] focus:border-[#144227] rounded-2xl text-xs sm:text-sm outline-none shadow-sm transition-all"
          />
        </div>

        {/* Category Pill Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer",
                activeCategory === cat
                  ? "bg-[#144227] text-white shadow-sm"
                  : "bg-white text-[#414942] border border-[#c1c9c0] hover:bg-[#eef7f0] hover:text-[#144227]"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Accordion List Grouped by Category */}
        <div className="space-y-8 pt-4">
          {groupedCategories.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-xs text-[#717971] space-y-2 border border-[#e5e2db]">
              <HelpCircle className="w-10 h-10 text-[#c1c9c0] mx-auto" />
              <p className="font-bold text-[#1c1c18]">No matching questions found</p>
              <p>Try searching for a different term or clearing your category filters.</p>
            </div>
          ) : (
            groupedCategories.map((catGroup) => {
              const categoryItems = filteredFaqs.filter(item => item.category === catGroup);
              return (
                <div key={catGroup} className="space-y-3">
                  <div className="text-[10px] font-extrabold uppercase tracking-widest text-[#144227] bg-[#eef7f0] px-3 py-1 rounded-md w-fit">
                    {catGroup}
                  </div>
                  <div className="space-y-3">
                    {categoryItems.map((faq, idx) => {
                      const itemKey = `${catGroup}-${idx}`;
                      const isOpen = !!openItems[itemKey];
                      return (
                        <div
                          key={itemKey}
                          className="bg-white border border-[#e5e2db] rounded-2xl overflow-hidden transition-all shadow-sm"
                        >
                          <button
                            type="button"
                            onClick={() => toggleItem(itemKey)}
                            className="w-full px-6 py-4 flex items-center justify-between text-left font-bold text-xs sm:text-sm text-[#1c1c18] hover:bg-[#f6f3ec]/40 transition-colors outline-none cursor-pointer"
                          >
                            <span className="font-bold pr-4">{faq.question}</span>
                            {isOpen ? (
                              <ChevronUp size={16} className="text-[#144227] shrink-0 transition-transform" />
                            ) : (
                              <ChevronDown size={16} className="text-[#717971] shrink-0 transition-transform" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-6 pb-4 pt-1 text-xs text-[#717971] leading-relaxed border-t border-[#f0eee7] bg-[#fcf9f2]/30 font-medium">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Strip: Still Have Questions */}
        <div className="bg-[#eef7f0] border border-[#9ed0ab]/50 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left mt-12">
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-[#144227]">Still have questions?</h3>
            <p className="text-xs text-[#414942] font-medium">Can't find the answer you're looking for? Reach out to our support team.</p>
          </div>
          <button
            onClick={() => onNavigate ? onNavigate('landing') : null}
            className="bg-[#144227] hover:bg-[#376847] text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-2 shrink-0"
          >
            <MessageCircle size={16} />
            Contact Support
          </button>
        </div>

      </div>
    </div>
  );
}
