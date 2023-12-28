import {ReplaySubject} from 'rxjs';

export const pathChangeObservable = new ReplaySubject<string>();
