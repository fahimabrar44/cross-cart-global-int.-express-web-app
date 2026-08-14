import PageHeader from "@/utilities/PageHeader";
import React from 'react';
import { Mail, Phone, MessageCircle, MapPin, Clock, HelpCircle, Shield, ThumbsUp } from "lucide-react";

const HelpAndSupport = () => {
    return (
        <>
            <div className="w-full h-auto bg-soft-green overflow-x-hidden">
                <PageHeader title="ABOUT US" subtitle="HELP AND SUPPORT" mainLink="/about" subLink="/about/help-and-support" />
            </div>

            <div className="bg-white py-12 px-4 md:px-8 lg:px-16">
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-center text-gray-800">
                            Help & Support
                        </h1>
                        <p className="text-lg text-gray-700 leading-relaxed mb-8 text-center">
                            At <span className="italic">Cross Cart Global International Express</span>, we{"'"}re here to make your international and local shipping smooth, secure, and stress-free.
                            Our <span className="italic">Help & Support Team</span> is always ready to assist you with bookings, tracking, and delivery questions.
                        </p>
                    </div>

                    <div className="space-y-8">
                        <section className="bg-section rounded-lg p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                                <HelpCircle className="w-6 h-6 text-[#12352A] mr-2" />
                                <h2 className="text-2xl font-semibold text-gray-800">How We Can Help</h2>
                            </div>
                            <p className="text-gray-700 mb-4">You can contact us for:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li>Shipment booking and rate inquiries</li>
                                <li>Tracking and delivery status updates</li>
                                <li>Customs or documentation assistance</li>
                                <li>Lost, delayed, or damaged parcel claims</li>
                                <li>Technical issues with your CrossCart Global Int Express account</li>
                            </ul>
                        </section>

                        <section className="bg-section rounded-lg p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                                <MessageCircle className="w-6 h-6 text-[#12352A] mr-2" />
                                <h2 className="text-2xl font-semibold text-gray-800">Support Channels</h2>
                            </div>
                            <p className="text-gray-700 mb-4">We offer multiple ways to reach our support team:</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                <div className="flex items-center gap-3 p-3 bg-white rounded shadow-sm">
                                    <Mail className="w-5 h-5 text-[#12352A]" />
                                    <div>
                                        <p className="font-medium text-gray-800">Email</p>
                                        <a href="mailto:cross.cart.bd@gmail.com" className="text-primary hover:underline">cross.cart.bd@gmail.com</a>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded shadow-sm">
                                    <Phone className="w-5 h-5 text-[#12352A]" />
                                    <div>
                                        <p className="font-medium text-gray-800">Hotline</p>
                                        <a href="tel:+8801410144466" className="text-primary hover:underline">+88 0141-0144466</a>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded shadow-sm">
                                    <MessageCircle className="w-5 h-5 text-[#12352A]" />
                                    <div>
                                        <p className="font-medium text-gray-800">Live Chat</p>
                                        <p className="text-gray-600 text-sm">Available on our website and mobile app</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded shadow-sm">
                                    <MapPin className="w-5 h-5 text-[#12352A]" />
                                    <div>
                                        <p className="font-medium text-gray-800">Office</p>
                                        <p className="text-gray-600 text-sm">Insert Address, Dhaka, Bangladesh</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 p-3 bg-soft-green rounded">
                                <Clock className="w-5 h-5 text-[#12352A]" />
                                <p className="text-gray-700">
                                    Our support team is available <span className="font-semibold">7 days a week, from 9:00 AM – 10:00 PM (BST)</span>.
                                </p>
                            </div>
                        </section>

                        <section className="bg-section rounded-lg p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                                <HelpCircle className="w-6 h-6 text-[#12352A] mr-2" />
                                <h2 className="text-2xl font-semibold text-gray-800">Quick Self-Service</h2>
                            </div>
                            <p className="text-gray-700 mb-4">For faster answers, visit our <span className="italic">FAQ section</span> to:</p>
                            <ul className="list-disc pl-6 space-y-2 text-gray-700">
                                <li>Track your shipment in real time</li>
                                <li>Check shipping restrictions and required documents</li>
                                <li>Learn about customs clearance and packaging tips</li>
                                <li>Manage pickup and delivery options</li>
                            </ul>
                        </section>

                        <section className="bg-section rounded-lg p-6 shadow-sm">
                            <div className="flex items-center mb-4">
                                <Shield className="w-6 h-6 text-[#12352A] mr-2" />
                                <h2 className="text-2xl font-semibold text-gray-800">Escalation & Feedback</h2>
                            </div>
                            <p className="text-gray-700 mb-4">
                                If your issue is not resolved promptly, you can escalate it to our <span className="italic">Trust & Safety Team</span> at 
                                <a href="mailto:cross.cart.bd@gmail.com" className="text-primary hover:underline ml-1">cross.cart.bd@gmail.com</a>.
                            </p>
                            <div className="flex items-start gap-2 p-3 bg-blue-50 rounded">
                                <ThumbsUp className="w-5 h-5 text-[#12352A] mt-0.5" />
                                <p className="text-gray-700">
                                    Your feedback helps us improve our service — we encourage you to share your experience with us anytime.
                                </p>
                            </div>
                        </section>

                        <section className="bg-[#12352A] text-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-2xl font-semibold mb-4 text-center">Cross Cart Global International Express Promise</h2>
                            <blockquote className="text-center text-lg italic">
                                {'"'}Fast support, fair solutions, and friendly service — that{"'"}s the Cross Cart Global International Express way.{'"'}
                            </blockquote>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
};

export default HelpAndSupport;