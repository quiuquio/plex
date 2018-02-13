import * as React from 'react';
import { LoanEntity } from '../../../../models';
import { formatDate, formatTime } from '../../../../utils';
import { Row, Col } from 'reactstrap';
import './ActiveLoan.css';

interface Props {
	loan: LoanEntity;
}

interface RepaymentSchedule {
	timestamp: number;
	type: string;
}

class ActiveLoan extends React.Component<Props, {}> {
	render() {
		const loan = this.props.loan;
		const now = Math.round((new Date()).getTime() / 1000);
		const pastIcon = require('../../../../assets/img/ok_circle.png');
		const futureIcon = require('../../../../assets/img/circle_outline.png');
		const repaymentSchedules: RepaymentSchedule[] = [];
		let repaymentTimestamp = loan.createdOnTimestamp;
		if (loan.installments) {
			let count = 0;
			switch (loan.collateralLockupPeriod) {
				case '1day':
					while (count < 4) {
						repaymentTimestamp += (60 * 60 * 4); // per 4 hours
						repaymentSchedules.push({timestamp: repaymentTimestamp, type: 'time'});
						count++;
					}
					break;
				case '1week':
					while (count < 7) {
						repaymentTimestamp += (60 * 60 * 24); // per day
						repaymentSchedules.push({timestamp: repaymentTimestamp, type: 'date'});
						count++;
					}
					break;
				case 'custom':
					if (loan.collateralCustomLockupPeriod) {
						while (count < loan.collateralCustomLockupPeriod) {
							repaymentTimestamp += (60 * 60 * 24 * 7); // per week
							repaymentSchedules.push({timestamp: repaymentTimestamp, type: 'date'});
							count++;
						}
					}
					break;
				default:
					break;
			}
		} else {
			switch (loan.collateralLockupPeriod) {
				case '1day':
					repaymentTimestamp += (60 * 60 * 24);
					break;
				case '1week':
					repaymentTimestamp += (60 * 60 * 24 * 7);
					break;
				case 'custom':
					if (loan.collateralCustomLockupPeriod) {
						repaymentTimestamp += (60 * 60 * 24 * loan.collateralCustomLockupPeriod);
					}
					break;
				default:
					break;
			}
			repaymentSchedules.push({timestamp: repaymentTimestamp, type: 'date'});
		}

		const repaymentScheduleItems: JSX.Element[] = [];
		let maxDisplay = 0;
		repaymentSchedules.forEach((paymentSchedule) => {
			if (maxDisplay < 5) {
				if (maxDisplay === 4 && repaymentSchedules.length > 5) {
					repaymentScheduleItems.push((
							<div className={'date-container active'} key={paymentSchedule.timestamp}>
								<div className="date-icon">
										<img src={futureIcon} />
								</div>
								<div className="strikethrough" />
								<div className="more">+ {repaymentSchedules.length - maxDisplay} more</div>
							</div>
						)
					);
				} else {
					repaymentScheduleItems.push((
							<div className={'date-container ' + (now > paymentSchedule.timestamp ? '' : 'active')} key={paymentSchedule.timestamp}>
								<div className="date-icon">
										<img src={now > paymentSchedule.timestamp ? pastIcon : futureIcon} />
								</div>
								<div className="strikethrough" />
								<div className="repayment-date">{paymentSchedule.type === 'date' ? formatDate(paymentSchedule.timestamp) : formatTime(paymentSchedule.timestamp)}</div>
							</div>
						)
					);
				}
			}
			maxDisplay++;
		});

		return (
			<Row className="active-loan-container">
				<Col xs="4" md="1" className="image-container">
					<div className="image" />
				</Col>
				<Col xs="8" md="5" className="detail-container">
					<div className="amount">{loan.amount} {loan.currency}</div>
					<div className="url"><a href={`dharma.io/${loan.id}`}>{`dharma.io/${loan.id}`}</a></div>
					<div className="active">Active</div>
					<div className="terms">{loan.terms} Interest{loan.installments ? ' (Installments)' : ''}</div>
				</Col>
				<Col xs="12" md="6" className="repayment-container">
					<div className="title">Repayment Schedule</div>
					{repaymentScheduleItems}
				</Col>
			</Row>
		);
	}
}

export { ActiveLoan };