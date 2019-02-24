'use strict';
/**
 * Candidate Bundles
 *
 * @package     MHW Calculator
 * @author      Scar Wu
 * @copyright   Copyright (c) Scar Wu (http://scar.tw)
 * @link        https://github.com/scarwu/MHWCalculator
 */

// Load Libraries
import React, { Component } from 'react';

// Load Core Libraries
import Event from 'core/event';
import Status from 'core/status';
import Helper from 'core/helper';

// Load Custom Libraries
import _ from 'libraries/lang';
import WeaponDataset from 'libraries/dataset/weapon';
import ArmorDataset from 'libraries/dataset/armor';
import CharmDataset from 'libraries/dataset/charm';
import JewelDataset from 'libraries/dataset/jewel';
import SkillDataset from 'libraries/dataset/skill';
import FittingAlgorithm from 'libraries/fittingAlgorithm';

// Load Components
import FunctionalIcon from 'components/common/functionalIcon';

// Load Constant
import Constant from 'constant';

export default class CandidateBundles extends Component {

    // Default Props
    static defaultProps = {
        data: {},
        onPickUp: (data) => {}
    };

    constructor (props) {
        super(props);

        let candidateBundles = Status.get('candidateBundles');

        // Initial State
        this.state = {
            bundleList: (undefined !== candidateBundles)
                ? candidateBundles.bundleList : false,
            bundleLimit: 25,
            searchTime: (undefined !== candidateBundles)
                ? candidateBundles.searchTime : null,
            isSearching: false
        };
    }

    /**
     * Handle Functions
     */
    handleBundlePickUp = (index) => {
        let bundleList = this.state.bundleList;

        this.props.onPickUp(bundleList[index]);
    };

    handleLimitChange = () => {
        let bundleLimit = parseInt(this.refs.bundleLimit.value, 10);
        bundleLimit = !isNaN(bundleLimit) ? bundleLimit : 0;

        this.setState({
            bundleLimit: bundleLimit
        });
    };

    /**
     * Lifecycle Functions
     */
    componentDidMount () {
        Event.on('SearchCandidateEquips', 'CandidateBundles', (data) => {
            this.setState({
                isSearching: true
            });

            setTimeout(() => {
                let startTime = new Date().getTime();
                let bundleList = FittingAlgorithm.search(data.equips, data.ignoreEquips, data.sets, data.skills);
                let stopTime = new Date().getTime();

                let searchTime = (stopTime - startTime) / 1000;

                Helper.log('Bundle List:', bundleList);
                Helper.log('Search Time:', searchTime);

                Status.set('candidateBundles', {
                    bundleList: bundleList,
                    searchTime: searchTime
                });

                this.setState({
                    bundleList: bundleList,
                    searchTime: searchTime,
                    isSearching: false
                });
            }, 100);
        });
    }

    /**
     * Render Functions
     */
    renderBundleItems = () => {
        let bundleList = this.state.bundleList;
        let bundleLimit = this.state.bundleLimit;

        return bundleList.slice(0, bundleLimit).map((data, index) => {
            return (
                <div key={index} className="row mhwc-bundle">
                    <div className="col-12 mhwc-name">
                        <span className="mhwc-bundle_name">{_('bundle')}: {index + 1}</span>

                        <div className="mhwc-icons_bundle">
                            <FunctionalIcon
                                iconName="check" altName={_('equip')}
                                onClick={() => {this.handleBundlePickUp(index)}} />
                        </div>
                    </div>

                    <div className="col-12 mhwc-item mhwc-equips">
                        <div className="col-12 mhwc-name">
                            <span>{_('equip')}</span>
                        </div>
                        <div className="col-12 mhwc-value">
                            <div className="row">
                            {Object.keys(data.equips).map((equipType, index) => {
                                if (null === data.equips[equipType]) {
                                    return false;
                                }

                                let equipInfo = null;

                                if ('weapon' === equipType) {
                                    equipInfo = WeaponDataset.getInfo(data.equips[equipType]);
                                } else if ('helm' === equipType
                                    || 'chest' === equipType
                                    || 'arm' === equipType
                                    || 'waist' === equipType
                                    || 'leg' === equipType) {

                                    equipInfo = ArmorDataset.getInfo(data.equips[equipType]);
                                } else if ('charm' === equipType) {
                                    equipInfo = CharmDataset.getInfo(data.equips[equipType]);
                                }

                                return (null !== equipInfo) ? [(
                                    <div key={`${equipType}_1`} className="col-2">
                                        <div className="mhwc-name">
                                            <span>{_(equipType)}</span>
                                        </div>
                                    </div>
                                ), (
                                    <div key={`${equipType}_2`} className="col-4">
                                        <div className="mhwc-value">
                                            <span>{_(equipInfo.name)}</span>
                                        </div>
                                    </div>
                                )] : false;
                            })}
                            </div>
                        </div>
                    </div>

                    <div className="col-12 mhwc-item mhwc-defense">
                        <div className="row">
                            <div className="col-4 mhwc-name">
                                <span>{_('defense')}</span>
                            </div>
                            <div className="col-8 mhwc-value">
                                <span>{data.defense}</span>
                            </div>
                        </div>
                    </div>

                    {(0 < data.meta.remainingSlotCount.all) ? (
                        <div className="col-12 mhwc-item mhwc-slots">
                            <div className="col-12 mhwc-name">
                                <span>{_('remainingSlot')}</span>
                            </div>
                            <div className="col-12 mhwc-value">
                                <div className="row">
                                    {Object.keys(data.meta.remainingSlotCount).map((slotSize) => {
                                        if ('all' === slotSize) {
                                            return;
                                        }

                                        let slotCount = data.meta.remainingSlotCount[slotSize];

                                        return (slotCount > 0) ? (
                                            <div key={slotSize} className="col-4">
                                                <div className="mhwc-value">
                                                    <span>{`[${slotSize}] x ${slotCount}`}</span>
                                                </div>
                                            </div>
                                        ) : false;
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : false}

                    {(0 !== Object.keys(data.jewels).length) ? (
                        <div className="col-12 mhwc-item mhwc-jewels">
                            <div className="col-12 mhwc-name">
                                <span>{_('jewel')}</span>
                            </div>
                            <div className="col-12 mhwc-value">
                                <div className="row">
                                    {Object.keys(data.jewels).sort((a, b) => {
                                        return data.jewels[b] - data.jewels[a];
                                    }).map((jewelId) => {
                                        let jewelCount = data.jewels[jewelId];
                                        let jewelName = JewelDataset.getInfo(jewelId).name;
                                        let jewelSize = JewelDataset.getInfo(jewelId).size;

                                        return (
                                            <div key={jewelId} className="col-4">
                                                <div className="mhwc-value">
                                                    <span>{`[${jewelSize}] ${_(jewelName)} x ${jewelCount}`}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : false}

                    {(0 !== Object.keys(data.skills).length) ? (
                        <div className="col-12 mhwc-item mhwc-skills">
                            <div className="col-12 mhwc-name">
                                <span>{_('skill')}</span>
                            </div>
                            <div className="col-12 mhwc-value">
                                <div className="row">
                                    {Object.keys(data.skills).sort((a, b) => {
                                        return data.skills[b] - data.skills[a];
                                    }).map((skillId) => {
                                        let skillCount = data.skills[skillId];
                                        let skillName = SkillDataset.getInfo(skillId).name;;

                                        return (
                                            <div key={skillId} className="col-6">
                                                <div className="mhwc-value">
                                                    <span>{`${_(skillName)} Lv.${skillCount}`}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : false}
                </div>
            );
        });
    };

    render () {
        return [(
            <div key={'bar'} className="row mhwc-panel">
                {true === this.state.isSearching ? (
                    <div className="mhwc-mask">
                        <i className="fa fa-spin fa-cog"></i>
                    </div>
                ) : false}

                {(null !== this.state.searchTime) ? (
                    <div className="row mhwc-search_info">
                        <div className="col-12">
                            <span>
                                {_('searchResult1').replace('%s', this.state.searchTime)}
                                <input type="text" defaultValue={this.state.bundleLimit} ref="bundleLimit" onChange={this.handleLimitChange} />
                                {_('searchResult2').replace('%s', this.state.bundleList.length)}
                            </span>
                        </div>
                    </div>
                ) : false}
            </div>
        ), (
            <div key="list" className="mhwc-list">
                {this.renderBundleItems()}
            </div>
        )];
    }
}
