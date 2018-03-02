import { connect } from 'react-redux';
import { FillLoanEntered } from './FillLoanEntered';
import { setError } from '../../../common/actions';

const mapStateToProps = (state: any) => {
	return {
		web3: state.web3Reducer.web3,
		accounts: state.web3Reducer.accounts,
		dharma: state.dharmaReducer.dharma,
		tokens: state.tokenReducer.tokens
	};
};

const mapDispatchToProps = (dispatch: any) => {
	return {
		handleSetError: (errorMessage: string) => dispatch(setError(errorMessage))
	};
};

export const FillLoanEnteredContainer = connect(
	mapStateToProps,
	mapDispatchToProps
)(FillLoanEntered);