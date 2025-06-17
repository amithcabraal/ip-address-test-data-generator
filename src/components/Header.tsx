import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  QuestionMarkCircleIcon,
  ShareIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { ThemeSelector } from './ThemeSelector';
import { Instructions } from './Instructions';

export const Header = () => {
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <>
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">IP Generator</h1>
            </div>
            
            <Menu as="div" className="relative ml-3">
              <Menu.Button className="p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                <Bars3Icon className="h-6 w-6" />
              </Menu.Button>
              
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => setShowInstructions(true)}
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-600' : ''
                          } flex w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          <QuestionMarkCircleIcon className="h-5 w-5 mr-2" />
                          Instructions
                        </button>
                      )}
                    </Menu.Item>
                    
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#share"
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-600' : ''
                          } flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          <ShareIcon className="h-5 w-5 mr-2" />
                          Share
                        </a>
                      )}
                    </Menu.Item>
                    
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#privacy"
                          className={`${
                            active ? 'bg-gray-100 dark:bg-gray-600' : ''
                          } flex px-4 py-2 text-sm text-gray-700 dark:text-gray-200`}
                        >
                          <ShieldCheckIcon className="h-5 w-5 mr-2" />
                          Privacy Policy
                        </a>
                      )}
                    </Menu.Item>
                    
                    <div className="border-t border-gray-200 dark:border-gray-600" />
                    
                    <div className="px-4 py-2">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-200">Theme</span>
                      </div>
                      <ThemeSelector />
                    </div>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </header>

      {showInstructions && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Instructions />
          </div>
        </div>
      )}
    </>
  );
};