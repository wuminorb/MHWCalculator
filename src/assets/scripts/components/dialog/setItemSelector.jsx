'use strict';
/**
 * Set Item Selector
 *
 * @package     MHW Calculator
 * @author      Scar Wu
 * @copyright   Copyright (c) Scar Wu (http://scar.tw)
 * @link        https://github.com/scarwu/MHWCalculator
 */

// Load Libraries
import React, { Component } from 'react';

// Load Core Libraries
import Helper from 'core/helper';

// Load Custom Libraries
import _ from 'libraries/lang';
import SetDataset from 'libraries/dataset/set';
import SkillDataset from 'libraries/dataset/skill';

// Load Components
import FunctionalIcon from 'components/common/functionalIcon';

// Load Constant
import Constant from 'constant';

let initState = (data) => {
    let selectedList = [];
    let unselectedList = [];

    data = data.map((set) => {
        return set.id;
    });

    SetDataset.getNames().sort().forEach((setId) => {

        let set = SetDataset.getInfo(setId);

        // Skip Selected Sets
        if (-1 !== data.indexOf(set.id)) {
            selectedList.push(set);
        } else {
            unselectedList.push(set);
        }
    });

    return {
        selectedList: selectedList,
        unselectedList: unselectedList
    };
};

export default class SetItemSelector extends Component {

    // Default Props
    static defaultProps = {
        data: {},
        onPickUp: (data) => {},
        onThrowDown: (data) => {},
        onClose: () => {}
    };

    constructor (props) {
        super(props);

        // Initial State
        this.state = Object.assign({
            data: {},
            list: [],
            segment: null
        }, initState(props.data));
    }

    /**
     * Handle Functions
     */
    handleWindowClose = () => {
        this.props.onClose();
    };

    handleItemPickUp = (itemId) => {
        this.props.onPickUp({
            setId: itemId
        });
    };

    handleItemThrowDown = (itemId) => {
        this.props.onThrowDown({
            setId: itemId
        });
    };

    handleSegmentInput = () => {
        let segment = this.refs.segment.value;

        segment = (0 !== segment.length) ? segment.trim() : null;

        this.setState({
            segment: segment
        });
    };

    /**
     * Lifecycle Functions
     */
    static getDerivedStateFromProps(nextProps, prevState) {
        return initState(nextProps.data);
    }

    /**
     * Render Functions
     */
    renderRow = (data, isSelect) => {
        return (
            <tr key={data.id}>
                <td><span>{_(data.name)}</span></td>
                <td>
                    {data.skills.map((skill, index) => {
                        return (
                            <div key={index}>
                                <span>({skill.require}) {_(skill.name)}</span>
                            </div>
                        );
                    })}
                </td>
                <td>
                    {data.skills.map((skill, index) => {
                        let skillInfo = SkillDataset.getInfo(skill.id);

                        return (
                            <div key={index}>
                                <span>{_(skillInfo.list[0].description)}</span>
                            </div>
                        );
                    })}
                </td>
                <td>
                    <div className="mhwc-icons_bundle">
                        {isSelect ? (
                            <FunctionalIcon
                                iconName="minus" altName={_('remove')}
                                onClick={() => {this.handleItemThrowDown(data.id)}} />
                        ) : (
                            <FunctionalIcon
                                iconName="plus" altName={_('add')}
                                onClick={() => {this.handleItemPickUp(data.id)}} />
                        )}
                    </div>
                </td>
            </tr>
        );
    };

    renderTable = () => {
        let segment = this.state.segment;

        return (
            <table className="mhwc-set_table">
                <thead>
                    <tr>
                        <td>{_('name')}</td>
                        <td>{_('skill')}</td>
                        <td>{_('description')}</td>
                        <td></td>
                    </tr>
                </thead>
                <tbody>
                    {this.state.selectedList.map((data, index) => {

                        // Create Text
                        let text = _(data.name);

                        data.skills.forEach((data) => {
                            let skillInfo = SkillDataset.getInfo(data.id);

                            text += _(skillInfo.name) + skillInfo.list.map((item) => {
                                return _(item.description);
                            }).join('');
                        });

                        // Search Nameword
                        if (null !== segment
                            && -1 === text.toLowerCase().search(segment.toLowerCase())) {

                            return false;
                        }

                        return this.renderRow(data, true);
                    })}

                    {this.state.unselectedList.map((data, index) => {

                        // Create Text
                        let text = _(data.name);

                        data.skills.forEach((data) => {
                            let skillInfo = SkillDataset.getInfo(data.id);

                            text += _(skillInfo.name) + skillInfo.list.map((item) => {
                                return _(item.description);
                            }).join('');
                        });

                        // Search Nameword
                        if (null !== segment
                            && -1 === text.toLowerCase().search(segment.toLowerCase())) {

                            return false;
                        }

                        return this.renderRow(data, false);
                    })}
                </tbody>
            </table>
        );
    };

    render () {
        return (
            <div className="mhwc-selector">
                <div className="mhwc-dialog">
                    <div className="mhwc-panel">
                        <input className="mhwc-text_segment" type="text"
                            placeholder={_('inputKeyword')}
                            ref="segment" onChange={this.handleSegmentInput} />

                        <div className="mhwc-icons_bundle">
                            <FunctionalIcon
                                iconName="times" altName={_('close')}
                                onClick={this.handleWindowClose} />
                        </div>
                    </div>
                    <div className="mhwc-list">
                        {this.renderTable()}
                    </div>
                </div>
            </div>
        );
    }
}
