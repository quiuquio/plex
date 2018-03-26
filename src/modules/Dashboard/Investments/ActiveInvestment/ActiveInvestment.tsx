import * as React from 'react';
import { InvestmentEntity } from '../../../../models';
import {
	formatDate,
	formatTime,
	getIdenticonImgSrc,
	shortenString,
	amortizationUnitToFrequency,
	debtOrderFromJSON
} from '../../../../utils';
import {
	Wrapper,
	ImageContainer,
	IdenticonImage,
	DetailContainer,
	Amount,
	Url,
	StatusActive,
	StatusDefaulted,
	Terms,
	RepaymentScheduleContainer,
	Schedule,
	ScheduleIconContainer,
	ScheduleIcon,
	Strikethrough,
	PaymentDate,
	ShowMore,
	Title,
	DetailLink,
	Drawer,
	InfoItem,
	InfoItemTitle,
	InfoItemContent,
	TransferButton
} from './styledComponents';
import { Row, Col, Collapse } from 'reactstrap';
import Dharma from '@dharmaprotocol/dharma.js';

interface Props {
	dharma: Dharma;
	investment: InvestmentEntity;
}

interface State {
	collapse: boolean;
	repaymentSchedule: number[];
}

class ActiveInvestment extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			collapse: false,
			repaymentSchedule: []
		};
		this.handleTransfer = this.handleTransfer.bind(this);
		this.toggleDrawer = this.toggleDrawer.bind(this);
	}

	async componentDidMount() {
		if (this.props.dharma && this.props.investment) {
			await this.getRepaymentSchedule(this.props.dharma, this.props.investment);
		}
	}

	async componentWillReceiveProps(nextProps: Props) {
		if (nextProps.dharma && nextProps.investment) {
			await this.getRepaymentSchedule(nextProps.dharma, nextProps.investment);
		}
	}

	async getRepaymentSchedule(dharma: Dharma, investment: InvestmentEntity) {
		try {
			if (investment.status === 'active') {
				const debtRegistry = await dharma.servicing.getDebtRegistryEntry(investment.issuanceHash);
				const repaymentSchedule = await dharma.adapters.simpleInterestLoan.getRepaymentSchedule(debtRegistry);
				this.setState({ repaymentSchedule });
			}
		} catch (e) {
			// console.log(e);
		}
	}

	handleTransfer(event: React.MouseEvent<HTMLElement>) {
		event.stopPropagation();
		const { investment } = this.props;
		console.log('Transfer: ', investment.issuanceHash);
	}

	toggleDrawer() {
		this.setState({ collapse: !this.state.collapse });
	}

	render() {
		const { investment } = this.props;
		if (!investment) {
			return null;
		}
		const { repaymentSchedule } = this.state;
		const investmentInfo = debtOrderFromJSON(investment.json);
		const now = Math.round((new Date()).getTime() / 1000);
		const pastIcon = require('../../../../assets/img/ok_circle.png');
		const futureIcon = require('../../../../assets/img/circle_outline.png');
		const repaymentScheduleItems: JSX.Element[] = [];
		let maxDisplay = 0;
		let selected = false;
		let selectedPaymentSchedule = 0;
		repaymentSchedule.forEach((paymentSchedule) => {
			if (maxDisplay < 5) {
				if (maxDisplay === 4 && repaymentSchedule.length > 5) {
					repaymentScheduleItems.push((
							<Schedule key={paymentSchedule}>
								<ScheduleIconContainer>
									<ScheduleIcon src={futureIcon} />
								</ScheduleIconContainer>
								<Strikethrough />
								<ShowMore>+ {repaymentSchedule.length - maxDisplay} more</ShowMore>
							</Schedule>
						)
					);
				} else {
					if (now <= paymentSchedule && !selected) {
						selectedPaymentSchedule = paymentSchedule;
						selected = true;
					}
					repaymentScheduleItems.push((
							<Schedule className={(selectedPaymentSchedule === paymentSchedule ? 'active' : '')} key={paymentSchedule}>
								<ScheduleIconContainer>
									<ScheduleIcon src={now > paymentSchedule ? pastIcon : futureIcon} />
								</ScheduleIconContainer>
								<Strikethrough />
								<PaymentDate>{investment.amortizationUnit !== 'hours' ? formatDate(paymentSchedule) : formatTime(paymentSchedule)}</PaymentDate>
							</Schedule>
						)
					);
				}
			}
			maxDisplay++;
		});

		const identiconImgSrc = getIdenticonImgSrc(investment.issuanceHash, 60, 0.1);
		return (
			<Wrapper onClick={this.toggleDrawer}>
				<Row>
					<ImageContainer>
						{identiconImgSrc && (
							<IdenticonImage src={identiconImgSrc} />
						)}
					</ImageContainer>
					<DetailContainer>
						<Row>
							<Col xs="12" md="6">
								<Amount>{investmentInfo!.principalAmount!.toNumber() + ' ' + investment.principalTokenSymbol}</Amount>
								<Url>
									<DetailLink to={`/request/success/${investment.issuanceHash}`}>
										{shortenString(investment.issuanceHash)}
									</DetailLink>
								</Url>
							</Col>
							<Col xs="12" md="6">
								{investment.status === 'active' && (
									<TransferButton onClick={this.handleTransfer}>Transfer</TransferButton>
								)}
							</Col>
						</Row>
						{investment.status === 'active' ? <StatusActive>Active</StatusActive> : <StatusDefaulted>Defaulted</StatusDefaulted>}
						<Terms>Simple Interest (Non-Collateralized)</Terms>
					</DetailContainer>
					<RepaymentScheduleContainer>
						<Title>Repayment Schedule</Title>
						{repaymentScheduleItems}
					</RepaymentScheduleContainer>
				</Row>
				<Collapse isOpen={this.state.collapse}>
					<Drawer>
						<Row>
							<Col xs="12" md="2">
								<InfoItem>
									<InfoItemTitle>
										Lended
									</InfoItemTitle>
									<InfoItemContent>
										{investmentInfo!.principalAmount!.toNumber() + ' ' + investment.principalTokenSymbol}
									</InfoItemContent>
								</InfoItem>
							</Col>
							<Col xs="12" md="2">
								<InfoItem>
									<InfoItemTitle>
										Earned
									</InfoItemTitle>
									<InfoItemContent>
										{investment.earnedAmount.toNumber() + ' ' + investment.principalTokenSymbol}
									</InfoItemContent>
								</InfoItem>
							</Col>
							<Col xs="12" md="2">
								<InfoItem>
									<InfoItemTitle>
										Term Length
									</InfoItemTitle>
									<InfoItemContent>
										{investment.termLength.toNumber() + ' ' + investment.amortizationUnit}
									</InfoItemContent>
								</InfoItem>
							</Col>
							<Col xs="12" md="2">
								<InfoItem>
									<InfoItemTitle>
										Interest Rate
									</InfoItemTitle>
									<InfoItemContent>
										{investment.interestRate.toNumber() + '%'}
									</InfoItemContent>
								</InfoItem>
							</Col>
							<Col xs="12" md="2">
								<InfoItem>
									<InfoItemTitle>
										Installment Frequency
									</InfoItemTitle>
									<InfoItemContent>
										{amortizationUnitToFrequency(investment.amortizationUnit)}
									</InfoItemContent>
								</InfoItem>
							</Col>
							<Col xs="12" md="2">
								<InfoItem>
									<InfoItemTitle>
										Description
									</InfoItemTitle>
									<InfoItemContent>
										{investment.description}
									</InfoItemContent>
								</InfoItem>
							</Col>
						</Row>
					</Drawer>
				</Collapse>
			</Wrapper>
		);
	}
}

export { ActiveInvestment };
