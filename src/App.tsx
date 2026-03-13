import { useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Form, Input, InputNumber, Radio, Row, Select, Space, Steps, Typography } from 'antd';
import { BadgeDollarSign, BarChart3, Building2, CircleHelp, FileChartColumnIncreasing, Scale, Sparkles } from 'lucide-react';
import type { IpValuationFormValues } from './types/ipValuation';
import { commercialStrengthQuestions, disclaimerParagraphs, economicReachOptions, ipTypeOptions, legalStatusOptions, lifespanOptions } from './data/ipValuationFlow';

const { Title, Text, Paragraph } = Typography;

const stepFields: Array<Array<keyof IpValuationFormValues>> = [
	[],
	['ipType', 'revenueYear1', 'revenueYear2', 'revenueYear3'],
	['q1', 'q2', 'q3', 'q4', 'q5'],
	['lifespan', 'legalStatus', 'economicReach'],
	[],
];

const contactFields: Array<keyof IpValuationFormValues> = ['fullName', 'companyName', 'email', 'phone'];

const stepItems = [
	{ title: 'A', description: 'Introduction' },
	{ title: 'B', description: 'Business Inputs' },
	{ title: 'C', description: 'Commercial Strength' },
	{ title: 'D', description: 'IP Factors' },
	{ title: 'E', description: 'Result' },
];

const TAX_RATE = 0.24;

const currencyFormatter = new Intl.NumberFormat('en-MY', {
	style: 'currency',
	currency: 'MYR',
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});

const currencyInputFormatter = (value: string | number | undefined) => {
	if (value === undefined || value === null || value === '') {
		return '';
	}
	const valueText = String(value);
	const [integerPart, decimalPart] = valueText.split('.');
	const groupedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
	const trimmedDecimal = decimalPart?.slice(0, 2);
	return trimmedDecimal !== undefined ? `RM ${groupedInteger}.${trimmedDecimal}` : `RM ${groupedInteger}`;
};

const currencyInputParser = (value: string | undefined) => {
	if (!value) {
		return '';
	}
	const cleanedValue = value.replace(/[^\d.]/g, '');
	const [integerPart = '', decimalPart = ''] = cleanedValue.split('.');
	return decimalPart ? `${integerPart}.${decimalPart.slice(0, 2)}` : integerPart;
};

function computeIndicativeValue(values: IpValuationFormValues) {
	const r1 = values.revenueYear1;
	const r2 = values.revenueYear2;
	const r3 = values.revenueYear3;
	const missingFields: string[] = [];

	if (r1 === undefined) missingFields.push('revenueYear1');
	if (r2 === undefined) missingFields.push('revenueYear2');
	if (r3 === undefined) missingFields.push('revenueYear3');
	if (!values.ipType) missingFields.push('ipType');
	if (!values.lifespan) missingFields.push('lifespan');
	if (!values.legalStatus) missingFields.push('legalStatus');
	if (!values.economicReach) missingFields.push('economicReach');

	if (missingFields.length > 0) {
		console.log('[IP Valuation] Missing base fields:', missingFields);
		return null;
	}
	if (r1 === undefined || r2 === undefined || r3 === undefined) {
		return null;
	}

	const ipType = ipTypeOptions.find((option) => option.value === values.ipType);
	const lifespan = lifespanOptions.find((option) => option.value === values.lifespan);
	const legalStatus = legalStatusOptions.find((option) => option.value === values.legalStatus);
	const economicReach = economicReachOptions.find((option) => option.value === values.economicReach);

	if (!ipType?.internalPercent || !lifespan?.multiplier || !legalStatus?.multiplier || !economicReach?.multiplier) {
		console.log('[IP Valuation] Invalid option mapping:', {
			ipTypeFound: Boolean(ipType),
			lifespanFound: Boolean(lifespan),
			legalStatusFound: Boolean(legalStatus),
			economicReachFound: Boolean(economicReach),
		});
		return null;
	}

	let totalScore = 0;
	for (const question of commercialStrengthQuestions) {
		const selectedValue = values[question.id];
		if (!selectedValue) {
			console.log('[IP Valuation] Missing commercial question answer:', question.id);
			return null;
		}
		const selectedOption = question.options.find((option) => option.value === selectedValue);
		if (!selectedOption || selectedOption.score === undefined) {
			console.log('[IP Valuation] Invalid commercial question mapping:', {
				questionId: question.id,
				selectedValue,
			});
			return null;
		}
		totalScore += selectedOption.score;
	}

	// Formula from user:
	// IPValue = ((R1 + R2 + R3) / 3) * (Score / 50) * RoyaltyRate * (1 - TaxRate) * GrowthTerm * LifeMultiplier * LegalMultiplier * EconomicMultiplier
	// GrowthTerm rule: if R1 is 0 or base growth is below 1, do not multiply growth (use 1).
	const averageRevenue = (r1 + r2 + r3) / 3;
	const scoreTerm = totalScore / 50;
	const royaltyRate = ipType.internalPercent;
	const taxTerm = 1 - TAX_RATE;
	const baseGrowth = r1 === 0 ? 1 : Math.pow(r3 / r1, 0.5);
	const growthTerm = r1 === 0 || baseGrowth < 1 ? 1 : baseGrowth;

	const result = averageRevenue * scoreTerm * royaltyRate * taxTerm * growthTerm * lifespan.multiplier * legalStatus.multiplier * economicReach.multiplier;

	return Number.isFinite(result) ? result : null;
}

export default function App() {
	const [form] = Form.useForm<IpValuationFormValues>();
	const [currentStep, setCurrentStep] = useState(0);
	const [showResultContactForm, setShowResultContactForm] = useState(false);
	const watchedValues = Form.useWatch([], form);
	const allValues = useMemo<IpValuationFormValues>(() => {
		// Keep values from unmounted step fields available for final-step calculation.
		return { ...(form.getFieldsValue(true) as IpValuationFormValues), ...(watchedValues ?? {}) };
	}, [form, watchedValues]);
	const shouldShowContactForm = allValues.revenueYear3 === 0;
	const isContactSubmissionMode = currentStep === 1 && shouldShowContactForm;

	const indicativeValue = useMemo(() => computeIndicativeValue(allValues), [allValues]);
	const formattedIndicativeValue = useMemo(() => (indicativeValue === null ? null : currencyFormatter.format(indicativeValue)), [indicativeValue]);

	const handleNext = async () => {
		if (currentStep === 1 && allValues.revenueYear3 === 0) {
			return;
		}
		const keys = stepFields[currentStep];
		if (keys.length > 0) {
			await form.validateFields(keys as string[]);
		}
		setCurrentStep((prev) => Math.min(prev + 1, stepItems.length - 1));
	};

	const handlePrev = () => {
		setCurrentStep((prev) => Math.max(prev - 1, 0));
	};

	const handleContactSubmit = async () => {
		await form.validateFields(contactFields as string[]);
	};

	return (
		<div className="ip-page">
			<div className="ip-content-shell">
				<div className="ip-header">
					<Space align="center" size={12}>
						<Title level={2} className="ip-title">
							IP Valuation Calculator
						</Title>
					</Space>
					<Paragraph className="ip-subtitle">A guided assessment to estimate the potential value of your intellectual property.</Paragraph>
				</div>

				<Card className="ip-main-card" bordered={false}>
					<Steps current={currentStep} items={stepItems} responsive className="ip-steps" />

					<Form form={form} layout="vertical" className="ip-form" preserve clearOnDestroy={false}>
						{currentStep === 0 && (
							<div className="ip-step-content">
								<Card className="ip-section-card" bordered>
									<Space size={12} align="center">
										<Sparkles size={20} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											Get Started
										</Title>
									</Space>
									<Paragraph>Understand the potential commercial value of your intellectual property in minutes.</Paragraph>
									<Paragraph type="secondary">Get a quick, business-friendly estimate using a guided assessment built for founders, business owners, and decision-makers.</Paragraph>
									<Button type="primary" size="large" onClick={handleNext}>
										Start Calculator
									</Button>
								</Card>
							</div>
						)}

						{currentStep === 1 && (
							<div className="ip-step-content">
								<Card className="ip-section-card" bordered>
									<Space size={10} align="center">
										<Building2 size={18} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											A. Type of IP Rights
										</Title>
									</Space>
									<Paragraph type="secondary" className="ip-section-description">
										Select the type of intellectual property to be valued.
									</Paragraph>
									<Form.Item label="IP Type" name="ipType" rules={[{ required: true, message: 'Please select an IP type.' }]} className="ip-gap-top">
										<Select
											placeholder="Choose IP type"
											options={ipTypeOptions.map((opt) => ({
												value: opt.value,
												label: opt.label,
											}))}
										/>
									</Form.Item>
								</Card>

								<Card className="ip-section-card" bordered>
									<Space size={10} align="center">
										<BarChart3 size={18} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											B. Revenue Generated by Your Business (Last 3 Years)
										</Title>
									</Space>
									<Paragraph type="secondary" className="ip-section-description">
										Enter the revenue generated by your business for the past three financial years.
									</Paragraph>
									<Row gutter={[16, 0]} className="ip-gap-top">
										<Col xs={24} md={8}>
											<Form.Item label="FY - Year 1" name="revenueYear1" rules={[{ required: true, message: 'Please enter year 1 revenue.' }]}>
												<InputNumber
													min={0}
													precision={2}
													className="ip-full-width"
													placeholder="Insert amount"
													formatter={currencyInputFormatter}
													parser={currencyInputParser}
												/>
											</Form.Item>
										</Col>
										<Col xs={24} md={8}>
											<Form.Item label="FY - Year 2" name="revenueYear2" rules={[{ required: true, message: 'Please enter year 2 revenue.' }]}>
												<InputNumber
													min={0}
													precision={2}
													className="ip-full-width"
													placeholder="Insert amount"
													formatter={currencyInputFormatter}
													parser={currencyInputParser}
												/>
											</Form.Item>
										</Col>
										<Col xs={24} md={8}>
											<Form.Item label="FY - Year 3 (Latest)" name="revenueYear3" rules={[{ required: true, message: 'Please enter year 3 revenue.' }]}>
												<InputNumber
													min={0}
													precision={2}
													className="ip-full-width"
													placeholder="Insert amount"
													formatter={currencyInputFormatter}
													parser={currencyInputParser}
												/>
											</Form.Item>
										</Col>
									</Row>
								</Card>

								{shouldShowContactForm && (
									<Card className="ip-section-card" bordered>
										<Space size={10} align="center">
											<CircleHelp size={18} className="ip-section-icon" />
											<Title level={4} className="ip-section-title">
												Contact Form
											</Title>
										</Space>
										{allValues.revenueYear3 === 0 && (
											<Alert
												type="warning"
												showIcon
												className="ip-gap-top"
												description="Even if your intellectual property has not yet generated revenue, it may still possess commercial value. Many early-stage brands, technologies, and digital assets are valuable due to their market potential, uniqueness, or strategic positioning. Our advisory team can assist in assessing the potential value and commercial opportunities of your IP."
											/>
										)}
										<Row gutter={[16, 0]} className="ip-gap-top">
											<Col xs={24} md={12}>
												<Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Please enter your full name.' }]}>
													<Input placeholder="Enter your name" />
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item label="Company Name" name="companyName" rules={[{ required: true, message: 'Please enter your company name.' }]}>
													<Input placeholder="Enter company name" />
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item
													label="Email Address"
													name="email"
													rules={[
														{ required: true, message: 'Please enter your email address.' },
														{ type: 'email', message: 'Please enter a valid email.' },
													]}
												>
													<Input placeholder="Enter email" />
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item label="Contact Number" name="phone" rules={[{ required: true, message: 'Please enter your phone number.' }]}>
													<Input placeholder="Enter phone number" />
												</Form.Item>
											</Col>
										</Row>
										<div className="ip-footer-actions">
											<Button type="primary" onClick={handleContactSubmit}>
												Submit
											</Button>
										</div>
									</Card>
								)}
							</div>
						)}

						{currentStep === 2 && (
							<div className="ip-step-content">
								<Card className="ip-section-card" bordered>
									<Space size={10} align="center">
										<FileChartColumnIncreasing size={18} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											C. IP Commercial Strength Assessment
										</Title>
									</Space>
									<Paragraph type="secondary" className="ip-section-description">
										Please answer the following questions to assess how strongly the IP contributes to your business.
									</Paragraph>

									<Space direction="vertical" size={12} className="ip-question-list">
										{commercialStrengthQuestions.map((question, idx) => (
											<Card size="small" key={question.id} className="ip-question-card">
												<Form.Item
													label={`${idx + 1}. ${question.prompt}`}
													name={question.id}
													rules={[{ required: true, message: 'Please choose one option.' }]}
													className="ip-question-field"
												>
													<Radio.Group className="ip-radio-vertical">
														<Space direction="vertical" size={6}>
															{question.options.map((option) => (
																<Radio key={option.value} value={option.value}>
																	<Text>{option.label}</Text>
																	{option.description && (
																		<Text type="secondary" className="ip-radio-description">
																			{' '}
																			- {option.description}
																		</Text>
																	)}
																</Radio>
															))}
														</Space>
													</Radio.Group>
												</Form.Item>
											</Card>
										))}
									</Space>
								</Card>
							</div>
						)}

						{currentStep === 3 && (
							<div className="ip-step-content">
								<Card className="ip-section-card" bordered>
									<Space size={10} align="center">
										<Scale size={18} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											D. Expected Lifespan of the IP
										</Title>
									</Space>
									<Paragraph type="secondary" className="ip-section-description">
										Select the estimated remaining useful life of the IP.
									</Paragraph>
									<Form.Item label="Lifespan" name="lifespan" rules={[{ required: true, message: 'Please select a lifespan.' }]} className="ip-gap-top">
										<Select
											placeholder="Select lifespan"
											options={lifespanOptions.map((option) => ({
												label: option.label,
												value: option.value,
											}))}
										/>
									</Form.Item>
								</Card>

								<Card className="ip-section-card" bordered>
									<Space size={10} align="center">
										<Scale size={18} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											E. Legal Status of the IP
										</Title>
									</Space>
									<Paragraph type="secondary" className="ip-section-description">
										Please select the current legal protection status of the intellectual property.
									</Paragraph>
									<Form.Item label="Legal Status" name="legalStatus" rules={[{ required: true, message: 'Please select the legal status.' }]} className="ip-gap-top">
										<Select
											placeholder="Select legal status"
											options={legalStatusOptions.map((option) => ({
												label: option.label,
												value: option.value,
											}))}
										/>
									</Form.Item>
								</Card>

								<Card className="ip-section-card" bordered>
									<Space size={10} align="center">
										<Scale size={18} className="ip-section-icon" />
										<Title level={4} className="ip-section-title">
											F. Economic Reach of the IP
										</Title>
									</Space>
									<Paragraph type="secondary" className="ip-section-description">
										Select how widely the intellectual property is commercially used or deployed.
									</Paragraph>
									<Form.Item label="Economic Reach" name="economicReach" rules={[{ required: true, message: 'Please select economic reach.' }]} className="ip-gap-top">
										<Select
											placeholder="Select economic reach"
											options={economicReachOptions.map((option) => ({
												label: option.label,
												value: option.value,
											}))}
										/>
									</Form.Item>
								</Card>
							</div>
						)}

						{currentStep === 4 && (
							<div className="ip-step-content">
								<Card className="ip-section-card ip-result-card" bordered>
									<Space size={10} align="center">
										<GlobeIcon />
										<Title level={4} className="ip-section-title">
											IP Valuation Result
										</Title>
									</Space>
									<div className="ip-result-box">
										<Title level={2} className="ip-result-value">
											{formattedIndicativeValue ?? 'Complete all required fields to view result'}
										</Title>
									</div>
								</Card>

								<Card className="ip-section-card" bordered>
									<Title level={5}>Disclaimer</Title>
									<Space direction="vertical" size={8}>
										{disclaimerParagraphs.map((paragraph) => (
											<Paragraph key={paragraph} className="ip-disclaimer-text">
												{paragraph}
											</Paragraph>
										))}
									</Space>
									<Button type="primary" onClick={() => setShowResultContactForm(true)}>
										Contact Advisory Team
									</Button>
								</Card>

								{showResultContactForm && (
									<Card className="ip-section-card" bordered>
										<Space size={10} align="center">
											<CircleHelp size={18} className="ip-section-icon" />
											<Title level={4} className="ip-section-title">
												Contact Form
											</Title>
										</Space>
										<Row gutter={[16, 0]} className="ip-gap-top">
											<Col xs={24} md={12}>
												<Form.Item label="Full Name" name="fullName" rules={[{ required: true, message: 'Please enter your full name.' }]}>
													<Input placeholder="Enter your name" />
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item label="Company Name" name="companyName" rules={[{ required: true, message: 'Please enter your company name.' }]}>
													<Input placeholder="Enter company name" />
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item
													label="Email Address"
													name="email"
													rules={[
														{ required: true, message: 'Please enter your email address.' },
														{ type: 'email', message: 'Please enter a valid email.' },
													]}
												>
													<Input placeholder="Enter email" />
												</Form.Item>
											</Col>
											<Col xs={24} md={12}>
												<Form.Item label="Contact Number" name="phone" rules={[{ required: true, message: 'Please enter your phone number.' }]}>
													<Input placeholder="Enter phone number" />
												</Form.Item>
											</Col>
										</Row>
										<div className="ip-footer-actions">
											<Button type="primary" onClick={handleContactSubmit}>
												Submit
											</Button>
										</div>
									</Card>
								)}
							</div>
						)}
					</Form>

					{currentStep > 0 && !isContactSubmissionMode && (
						<div className="ip-footer-actions">
							<Button onClick={handlePrev} disabled={currentStep === 0}>
								Back
							</Button>
							{currentStep < stepItems.length - 1 && (
								<Button type="primary" onClick={handleNext}>
									Next
								</Button>
							)}
						</div>
					)}
				</Card>
			</div>
		</div>
	);
}

function GlobeIcon() {
	return <BadgeDollarSign size={18} className="ip-section-icon" />;
}
